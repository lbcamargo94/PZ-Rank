/**
 * /webhooks — recebe notificações do YouTube Pub/Sub (WebSub)
 *
 * GET  /webhooks/youtube  — verificação de inscrição (challenge)
 * POST /webhooks/youtube  — notificação de novo vídeo/live
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { verifyHmac, parsePubSubAtom, checkIsLive, subscribePubSub } from '../lib/youtube';
import { sendLiveNotification } from '../lib/discord';
import { isChampionshipTitle } from '../lib/championship';

const router = Router();

// ── GET /webhooks/youtube — verificação WebSub ────────────────────────────────
// O hub do YouTube envia um GET com hub.challenge; devemos responder com o valor.
router.get('/youtube', (req: Request, res: Response): void => {
  const mode      = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && challenge) {
    res.status(200).send(String(challenge));
    return;
  }

  res.status(400).send('Bad Request');
});

// ── POST /webhooks/youtube — notificação de novo conteúdo ────────────────────
// O corpo chega como Atom/XML. Express precisa receber como raw buffer para
// validar o HMAC antes de parsear.
// IMPORTANTE: processamos tudo ANTES de responder 200 — em Vercel serverless,
// o runtime pode encerrar a função imediatamente após res.send(), abortando
// qualquer await posterior.
router.post('/youtube', async (req: Request, res: Response): Promise<void> => {
  const rawBody   = (req as Request & { rawBody?: Buffer }).rawBody;
  const signature = req.headers['x-hub-signature'] as string | undefined;
  const ct        = req.headers['content-type'];

  console.log('[webhook/youtube POST]', {
    contentType: ct,
    hasRawBody:  !!rawBody,
    bodyBytes:   rawBody?.length ?? 0,
    hasSig:      !!signature,
  });

  // Valida HMAC (se PUBSUB_SECRET configurado)
  if (rawBody && !verifyHmac(rawBody, signature)) {
    console.warn('[webhook/youtube] HMAC inválido — notificação ignorada');
    res.sendStatus(200); // sempre 200 para o hub não retentar
    return;
  }

  const xml = rawBody ? rawBody.toString('utf-8') : '';
  if (!xml) {
    console.warn('[webhook/youtube] body vazio (content-type provavelmente não é atom+xml)');
    res.sendStatus(200); return;
  }

  const entry = parsePubSubAtom(xml);
  if (!entry) {
    console.warn('[webhook/youtube] parse do Atom falhou');
    res.sendStatus(200); return;
  }

  console.log('[webhook/youtube] entrada recebida:', { videoId: entry.videoId, channelId: entry.channelId });

  // Verifica se o vídeo é uma live ativa
  const liveInfo = await checkIsLive(entry.videoId);
  if (!liveInfo?.isLive) {
    console.log('[webhook/youtube] não é live — ignorando');
    res.sendStatus(200); return;
  }

  // Busca o jogador pelo yt_channel_id
  const { data: player } = await supabase
    .from('players')
    .select('id, nick, yt_channel_id, yt_sub_expires_at, yt_last_live_video_id')
    .eq('yt_channel_id', entry.channelId)
    .is('deleted_at', null)
    .single();

  if (!player) {
    console.warn('[webhook/youtube] nenhum jogador com yt_channel_id:', entry.channelId);
    res.sendStatus(200); return;
  }

  // O YouTube reenvia notificações PubSub várias vezes para a mesma live ativa
  // (a cada atualização de metadados/título) — sem esse check, cada reenvio
  // disparava uma notificação nova no Discord para o mesmo início de live.
  if (player.yt_last_live_video_id === entry.videoId) {
    console.log('[webhook/youtube] vídeo já registrado — notificação duplicada ignorada:', entry.videoId);
    res.sendStatus(200); return;
  }

  console.log('[webhook/youtube] jogador encontrado:', player.nick);

  // Busca a melhor entry viva para rank e score
  const { data: entries } = await supabase
    .from('entries')
    .select('score, is_alive, sandbox_ok')
    .eq('player_id', player.id)
    .is('deleted_at', null)
    .order('score', { ascending: false });

  const bestAlive = (entries ?? []).find((e: { is_alive: boolean; sandbox_ok: boolean }) =>
    e.sandbox_ok !== false && e.is_alive
  );

  // Busca o rank global (posição entre entries vivos)
  let rank: number | null = null;
  if (bestAlive) {
    const { data: allAlive } = await supabase
      .from('entries')
      .select('player_id, score')
      .eq('is_alive', true)
      .eq('sandbox_ok', true)
      .is('deleted_at', null)
      .order('score', { ascending: false });

    if (allAlive) {
      const pos = (allAlive as Array<{ player_id: number; score: number }>)
        .findIndex(e => e.player_id === player.id);
      if (pos >= 0) rank = pos + 1;
    }
  }

  // Grava antes de notificar: se a função for cortada após a notificação,
  // a deduplicação já está garantida no próximo ciclo. Sempre grava — o
  // badge "Ao Vivo" do site e o aviso de transmissão não dependem de o
  // conteúdo ser do campeonato, só a notificação do Discord depende.
  await supabase
    .from('players')
    .update({ yt_last_live_video_id: entry.videoId })
    .eq('id', player.id);

  if (isChampionshipTitle(liveInfo.title, liveInfo.description)) {
    console.log('[webhook/youtube] enviando Discord:', { nick: player.nick });
    await sendLiveNotification({
      nick:      player.nick,
      title:     liveInfo.title,
      videoUrl:  entry.videoUrl,
      thumbnail: liveInfo.thumbnail,
      rank,
      score:     bestAlive?.score ?? null,
    });
  } else {
    console.log('[webhook/youtube] live não parece ser do campeonato — notificação pulada:', { nick: player.nick, title: liveInfo.title });
  }

  // Renova inscrição automaticamente ao receber notificação
  const renewed = await subscribePubSub(entry.channelId);
  if (renewed.ok) {
    await supabase
      .from('players')
      .update({ yt_sub_expires_at: renewed.expiresAt })
      .eq('id', player.id);
  }

  // Responde 200 APÓS todo o processamento — evita que o Vercel encerre
  // a função antes dos awaits acima completarem
  res.sendStatus(200);
});

// ── POST /webhooks/youtube/simulate — teste manual do pipeline ───────────────
// Simula uma notificação do YouTube sem HMAC. Só funciona se ALLOW_WEBHOOK_SIMULATE=true.
router.post('/youtube/simulate', async (req: Request, res: Response): Promise<void> => {
  if (process.env.ALLOW_WEBHOOK_SIMULATE !== 'true') {
    res.status(403).json({ error: 'Simulação desabilitada.' });
    return;
  }

  const { channelId, videoId, videoUrl, force, mockTitle, mockScore, mockRank, mockNick } = req.body as {
    channelId?: string; videoId?: string; videoUrl?: string;
    force?: boolean; mockTitle?: string; mockScore?: number; mockRank?: number; mockNick?: string;
  };

  if (!channelId || !videoId) {
    res.status(400).json({ error: 'channelId e videoId são obrigatórios.' });
    return;
  }

  let liveInfo = await checkIsLive(videoId);
  if (force) {
    // Modo forçado: ignora status de live, usa dados mock se fornecidos
    liveInfo = {
      isLive:      true,
      title:       mockTitle ?? liveInfo?.title ?? `[TESTE] Live simulada`,
      description: liveInfo?.description ?? '',
      thumbnail:   liveInfo?.thumbnail ?? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  } else {
    if (!liveInfo) {
      res.json({ ok: false, step: 'checkIsLive', reason: 'API retornou null (vídeo não existe ou erro)' });
      return;
    }
    if (!liveInfo.isLive) {
      res.json({ ok: false, step: 'checkIsLive', reason: 'Vídeo não está ao vivo', title: liveInfo.title });
      return;
    }
  }

  // mockNick permite testar sem player no DB — Discord irá receber o aviso com dados mock
  let playerNick: string;
  let finalRank: number | null  = mockRank  ?? null;
  let finalScore: number | null = mockScore ?? null;

  if (mockNick) {
    playerNick = mockNick;
  } else {
    const { data: player } = await supabase
      .from('players')
      .select('id, nick, yt_channel_id')
      .eq('yt_channel_id', channelId)
      .is('deleted_at', null)
      .single();

    if (!player) {
      res.json({ ok: false, step: 'findPlayer', reason: 'Nenhum jogador com esse yt_channel_id' });
      return;
    }

    playerNick = player.nick;

    if (mockRank == null || mockScore == null) {
      const { data: entries } = await supabase
        .from('entries')
        .select('score, is_alive, sandbox_ok, player_id')
        .eq('player_id', player.id)
        .is('deleted_at', null)
        .order('score', { ascending: false });

      const bestAlive = (entries ?? []).find((e: { is_alive: boolean; sandbox_ok: boolean }) =>
        e.sandbox_ok !== false && e.is_alive
      );

      if (bestAlive && mockScore == null) finalScore = bestAlive.score;

      if (bestAlive && mockRank == null) {
        const { data: allAlive } = await supabase
          .from('entries')
          .select('player_id, score')
          .eq('is_alive', true)
          .eq('sandbox_ok', true)
          .is('deleted_at', null)
          .order('score', { ascending: false });

        if (allAlive) {
          const pos = (allAlive as Array<{ player_id: number; score: number }>)
            .findIndex(e => e.player_id === player.id);
          if (pos >= 0) finalRank = pos + 1;
        }
      }
    }
  }

  const url = videoUrl ?? `https://www.youtube.com/watch?v=${videoId}`;

  await sendLiveNotification({
    nick:      playerNick,
    title:     liveInfo.title,
    videoUrl:  url,
    thumbnail: liveInfo.thumbnail,
    rank:      finalRank,
    score:     finalScore,
  });

  res.json({
    ok:       true,
    player:   playerNick,
    title:    liveInfo.title,
    rank:     finalRank,
    score:    finalScore,
    discord:  'notificação enviada',
  });
});

export default router;

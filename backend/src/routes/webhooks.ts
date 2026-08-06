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
router.post('/youtube', async (req: Request, res: Response): Promise<void> => {
  const rawBody  = (req as Request & { rawBody?: Buffer }).rawBody;
  const signature = req.headers['x-hub-signature'] as string | undefined;

  // Responde 200 imediatamente — o hub não aguarda processamento
  res.sendStatus(200);

  // Valida HMAC (se PUBSUB_SECRET configurado)
  if (rawBody && !verifyHmac(rawBody, signature)) {
    console.warn('[webhook/youtube] HMAC inválido — notificação ignorada');
    return;
  }

  const xml = rawBody ? rawBody.toString('utf-8') : '';
  if (!xml) return;

  const entry = parsePubSubAtom(xml);
  if (!entry) return;

  // Verifica se o vídeo é uma live ativa
  const liveInfo = await checkIsLive(entry.videoId);
  if (!liveInfo?.isLive) return;

  // Busca o jogador pelo yt_channel_id
  const { data: player } = await supabase
    .from('players')
    .select('id, nick, yt_channel_id, yt_sub_expires_at')
    .eq('yt_channel_id', entry.channelId)
    .is('deleted_at', null)
    .single();

  if (!player) return;

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

  await sendLiveNotification({
    nick:      player.nick,
    title:     liveInfo.title,
    videoUrl:  entry.videoUrl,
    thumbnail: liveInfo.thumbnail,
    rank,
    score:     bestAlive?.score ?? null,
  });

  // Renova inscrição automaticamente ao receber notificação
  const renewed = await subscribePubSub(entry.channelId);
  if (renewed.ok) {
    await supabase
      .from('players')
      .update({ yt_sub_expires_at: renewed.expiresAt })
      .eq('id', player.id);
  }
});

// ── POST /webhooks/youtube/simulate — teste manual do pipeline ───────────────
// Simula uma notificação do YouTube sem HMAC. Só funciona se ALLOW_WEBHOOK_SIMULATE=true.
router.post('/youtube/simulate', async (req: Request, res: Response): Promise<void> => {
  if (process.env.ALLOW_WEBHOOK_SIMULATE !== 'true') {
    res.status(403).json({ error: 'Simulação desabilitada.' });
    return;
  }

  const { channelId, videoId, videoUrl } = req.body as {
    channelId?: string; videoId?: string; videoUrl?: string;
  };

  if (!channelId || !videoId) {
    res.status(400).json({ error: 'channelId e videoId são obrigatórios.' });
    return;
  }

  const liveInfo = await checkIsLive(videoId);
  if (!liveInfo) {
    res.json({ ok: false, step: 'checkIsLive', reason: 'API retornou null (vídeo não existe ou erro)' });
    return;
  }
  if (!liveInfo.isLive) {
    res.json({ ok: false, step: 'checkIsLive', reason: 'Vídeo não está ao vivo', title: liveInfo.title });
    return;
  }

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

  const { data: entries } = await supabase
    .from('entries')
    .select('score, is_alive, sandbox_ok, player_id')
    .eq('player_id', player.id)
    .is('deleted_at', null)
    .order('score', { ascending: false });

  const bestAlive = (entries ?? []).find((e: { is_alive: boolean; sandbox_ok: boolean }) =>
    e.sandbox_ok !== false && e.is_alive
  );

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

  const url = videoUrl ?? `https://www.youtube.com/watch?v=${videoId}`;
  await sendLiveNotification({
    nick:      player.nick,
    title:     liveInfo.title,
    videoUrl:  url,
    thumbnail: liveInfo.thumbnail,
    rank,
    score:     bestAlive?.score ?? null,
  });

  res.json({
    ok:       true,
    player:   player.nick,
    title:    liveInfo.title,
    rank,
    score:    bestAlive?.score ?? null,
    discord:  'notificação enviada',
  });
});

export default router;

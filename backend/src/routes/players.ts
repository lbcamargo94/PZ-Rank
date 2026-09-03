import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requireModerator, requireMaster } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';
import { requirePlayer } from '../middleware/player';
import type { PlayerRequest } from '../middleware/player';
import type { PlayerStatus } from '../types';
import { sendApprovalEmail, sendActivationEmail, sendOtpEmail } from '../lib/email';
import { validatePassword } from '../lib/password';
import { config } from '../config';
import { YT_LIVE_MAX_AGE_MS } from '../lib/youtube';

const router = Router();

// Normaliza URLs de canal: adiciona https:// se o protocolo estiver ausente.
// Retorna null para strings vazias ou inválidas.
function normalizeUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

// GET /players/live-status — público: quem está ao vivo agora (YouTube ou Twitch)
//
// YouTube: lê yt_last_live_video_id direto do banco — SEM chamar a API do YouTube aqui.
// Uma versão anterior confirmava a live em tempo real via checkIsLive a cada chamada
// para não depender do Companion, mas isso amarrava o consumo da cota diária do YouTube
// Data API ao volume de acessos ao rank (frontend faz polling a cada 30s enquanto a
// página está aberta) — em produção isso estourou a cota em minutos e derrubou a
// detecção de live pro site inteiro (inclusive notificações do Discord, que usam a
// mesma API key). yt_last_live_video_id já é mantido fresco por vias que NÃO escalam
// com tráfego: webhook do YouTube (event-driven, ver webhooks.ts), o fire-and-forget
// em sync.ts e o /cron/scan-lives — todas corrigidas para limpar corretamente quando o
// vídeo não existe mais (ver checkIsLive em lib/youtube.ts).
//
// Twitch: sem webhook próprio, então é consultado a cada chamada — mas via API pública
// sem cota (ver lib/twitch.ts), então não tem o mesmo risco.
router.get('/live-status', async (_req: Request, res: Response): Promise<void> => {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, twitch_url, yt_last_live_video_id, yt_live_confirmed_at')
    .eq('status', 'approved')
    .is('deleted_at', null);

  if (error) {
    res.status(500).json({ error: 'Erro ao buscar status de live.', error_code: 'DB_ERROR' });
    return;
  }

  type LiveRow = {
    id: number; twitch_url: string | null;
    yt_last_live_video_id: string | null; yt_live_confirmed_at: string | null;
  };
  const rows = (players ?? []) as LiveRow[];

  const results: Array<{ player_id: number; platform: 'youtube' | 'twitch'; url: string; title?: string; thumbnail?: string }> = [];

  // Rede de segurança final: se por algum motivo yt_last_live_video_id nunca foi
  // limpo (checkIsLive falhando/degradado por muito tempo — ver YT_LIVE_MAX_AGE_MS
  // em lib/youtube.ts), não exibe como "ao vivo" além do teto de segurança, mesmo
  // que a limpeza em si ainda não tenha rodado.
  const now = Date.now();
  for (const p of rows) {
    if (!p.yt_last_live_video_id) continue;
    const confirmedAtMs = p.yt_live_confirmed_at ? new Date(p.yt_live_confirmed_at).getTime() : 0;
    if (now - confirmedAtMs > YT_LIVE_MAX_AGE_MS) continue;
    results.push({
      player_id: p.id,
      platform:  'youtube',
      url:       `https://www.youtube.com/watch?v=${p.yt_last_live_video_id}`,
    });
  }

  const { extractTwitchLogin, getLiveStreams } = await import('../lib/twitch');
  const loginByPlayer = new Map<string, number>();
  for (const p of rows) {
    if (!p.twitch_url) continue;
    const login = extractTwitchLogin(p.twitch_url);
    if (login) loginByPlayer.set(login, p.id);
  }

  if (loginByPlayer.size > 0) {
    const { live } = await getLiveStreams([...loginByPlayer.keys()]);
    for (const [login, info] of live) {
      const playerId = loginByPlayer.get(login);
      if (playerId == null) continue;
      results.push({
        player_id: playerId,
        platform:  'twitch',
        url:       `https://twitch.tv/${info.login}`,
        title:     info.title,
        thumbnail: info.thumbnail,
      });
    }
  }

  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  res.json(results);
});

// GET /players/featured-streamers — público: elenco de streamers oficiais para destaque na home
router.get('/featured-streamers', async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('players')
    .select('id, nick, youtube_url, twitch_url, gender')
    .eq('is_featured_streamer', true)
    .eq('status', 'approved')
    .is('deleted_at', null);

  if (error) {
    res.status(500).json({ error: 'Erro ao buscar streamers oficiais.', error_code: 'DB_ERROR' });
    return;
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  res.json(data ?? []);
});

const PLAYER_ENTRY_COLUMNS = [
  'id', 'player_id', 'name', 'character_name', 'profession',
  'days', 'time_raw', 'time_str', 'kills', 'skills', 'live_url',
  'is_alive', 'sandbox_ok', 'traits', 'objectives', 'score',
  'disqualification_reason', 'disqualified_at', 'deleted_at', 'updated_at',
  'no_live_streak',
].join(', ');

// Monta o payload de perfil (jogador + entries com rank calculado) compartilhado
// entre GET /players/:id (perfil público) e GET /players/:id/overlay (fonte OBS).
async function buildPlayerProfilePayload(id: number) {
  const [playerRes, entriesRes] = await Promise.all([
    supabase
      .from('players')
      .select('id, nick, twitch_url, youtube_url, kick_url, tiktok_url, is_featured_streamer, is_moderator')
      .eq('id', id)
      .single(),
    supabase
      .from('entries')
      .select(PLAYER_ENTRY_COLUMNS)
      .eq('player_id', id)
      .order('score', { ascending: false }),
  ]);

  if (playerRes.error || !playerRes.data) return null;

  // Posição no rank público, calculada aqui (COUNT sem trazer linhas) em vez de
  // fazer o cliente baixar a tabela de entries inteira só pra achar a própria
  // posição — isso sozinho respondia por boa parte do egress do Supabase
  // (GET /entries pesa ~660KB com 546 linhas, e era chamado só pra isso em
  // várias telas: PlayerPage, o overlay de OBS por jogador...).
  // Só entries vivas e não-desclassificadas entram no rank público — na
  // prática, no máximo uma por jogador na maioria dos casos.
  const entries = (entriesRes.data ?? []) as Array<{ id: number; score: number; is_alive: boolean; sandbox_ok?: boolean }>;
  const entriesWithRank = await Promise.all(entries.map(async (entry) => {
    if (!entry.is_alive || entry.sandbox_ok === false) return { ...entry, rank: null };
    const { count } = await supabase
      .from(config.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('is_alive', true).eq('sandbox_ok', true).is('deleted_at', null)
      .gt('score', entry.score);
    return { ...entry, rank: count !== null ? count + 1 : null };
  }));

  return { player: playerRes.data as { id: number; is_featured_streamer?: boolean; is_moderator?: boolean }, entries: entriesWithRank };
}

// GET /players/:id — público: retorna dados do jogador + todas as entradas dele no rank
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.', error_code: 'INVALID_ID' }); return; }

  const payload = await buildPlayerProfilePayload(id);
  if (!payload) {
    res.status(404).json({ error: 'Jogador não encontrado.', error_code: 'PLAYER_NOT_FOUND' });
    return;
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  res.json(payload);
});

// GET /players/:id/overlay — fonte de dados do overlay de OBS: disponível para qualquer jogador cadastrado.
router.get('/:id/overlay', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.', error_code: 'INVALID_ID' }); return; }

  const payload = await buildPlayerProfilePayload(id);
  if (!payload) {
    res.status(404).json({ error: 'Jogador não encontrado.', error_code: 'PLAYER_NOT_FOUND' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json(payload);
});

// Decodifica o token de jogador se presente, sem exigir (diferente de requirePlayer,
// que rejeitaria visitantes anônimos). Usado só para saber se o jogador logado já
// curtiu o perfil — falha silenciosa em qualquer problema (sem token, token inválido,
// tipo errado) simplesmente resulta em null.
function getOptionalPlayerId(req: Request): number | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7).trim(), config.jwtSecret) as { sub: string; type: string };
    if (payload.type !== 'player') return null;
    const id = parseInt(payload.sub, 10);
    return isNaN(id) ? null : id;
  } catch {
    return null;
  }
}

// GET /players/:id/likes — público: contagem de curtidas + se o jogador logado (se houver) já curtiu
router.get('/:id/likes', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.', error_code: 'INVALID_ID' }); return; }

  const { count, error } = await supabase
    .from('player_likes')
    .select('*', { count: 'exact', head: true })
    .eq('liked_player_id', id);

  if (error) { res.status(500).json({ error: 'Erro ao buscar curtidas.', error_code: 'DB_ERROR' }); return; }

  const viewerId = getOptionalPlayerId(req);
  let liked_by_me = false;
  if (viewerId !== null) {
    const { data } = await supabase
      .from('player_likes')
      .select('id')
      .eq('liker_player_id', viewerId)
      .eq('liked_player_id', id)
      .maybeSingle();
    liked_by_me = !!data;
  }

  res.json({ count: count ?? 0, liked_by_me });
});

// POST /players/:id/like — jogador logado: curte o perfil de outro jogador
router.post('/:id/like', requirePlayer, async (req: PlayerRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.', error_code: 'INVALID_ID' }); return; }

  if (id === req.playerId) {
    res.status(400).json({ error: 'Você não pode curtir o próprio perfil.', error_code: 'CANNOT_LIKE_SELF' });
    return;
  }

  const { data: target } = await supabase
    .from('players')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!target) { res.status(404).json({ error: 'Jogador não encontrado.', error_code: 'PLAYER_NOT_FOUND' }); return; }

  const { data: existing } = await supabase
    .from('player_likes')
    .select('id')
    .eq('liker_player_id', req.playerId!)
    .eq('liked_player_id', id)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await supabase
      .from('player_likes')
      .insert([{ liker_player_id: req.playerId!, liked_player_id: id }]);
    if (insertError) {
      // Corrida entre dois cliques quase simultâneos: ambos passam pelo check
      // de "existing" acima antes de qualquer um terminar o insert, e o
      // segundo esbarra na constraint única (liker, liked). Não é um erro de
      // verdade — a curtida já foi registrada pelo primeiro; só o segundo
      // request via um 500 genérico pro usuário sem essa checagem.
      const { data: recheck } = await supabase
        .from('player_likes')
        .select('id')
        .eq('liker_player_id', req.playerId!)
        .eq('liked_player_id', id)
        .maybeSingle();
      if (!recheck) { res.status(500).json({ error: 'Erro ao curtir perfil.', error_code: 'DB_ERROR' }); return; }
    }
  }

  const { count } = await supabase
    .from('player_likes')
    .select('*', { count: 'exact', head: true })
    .eq('liked_player_id', id);

  res.json({ liked: true, count: count ?? 0 });
});

// DELETE /players/:id/like — jogador logado: remove a curtida (idempotente)
router.delete('/:id/like', requirePlayer, async (req: PlayerRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.', error_code: 'INVALID_ID' }); return; }

  await supabase
    .from('player_likes')
    .delete()
    .eq('liker_player_id', req.playerId!)
    .eq('liked_player_id', id);

  const { count } = await supabase
    .from('player_likes')
    .select('*', { count: 'exact', head: true })
    .eq('liked_player_id', id);

  res.json({ liked: false, count: count ?? 0 });
});

// POST /players/register — público
// ⚠️ Cadastros suspensos temporariamente — altere para true para reabrir.
const REGISTRATIONS_OPEN = true;

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  if (!REGISTRATIONS_OPEN) {
    res.status(403).json({ error: 'Cadastros temporariamente suspensos. Acompanhe o servidor para novidades.' });
    return;
  }

  const { nick, email, password, twitch_url, youtube_url, kick_url, tiktok_url, terms_accepted } = req.body as {
    nick?:           string;
    email?:          string;
    password?:       string;
    twitch_url?:     string;
    youtube_url?:    string;
    kick_url?:       string;
    tiktok_url?:     string;
    terms_accepted?: boolean;
  };

  if (!nick?.trim()) {
    res.status(400).json({ error: 'Nick do jogador é obrigatório.' });
    return;
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }
  if (!terms_accepted) {
    res.status(400).json({ error: 'É necessário aceitar as regras de conduta para se cadastrar.' });
    return;
  }
  if (!youtube_url?.trim()) {
    res.status(400).json({ error: 'O link do canal do YouTube é obrigatório para participar do rank.' });
    return;
  }
  if (!/youtube\.com|youtu\.be/i.test(youtube_url.trim())) {
    res.status(400).json({ error: 'O link informado não parece ser um canal do YouTube válido.' });
    return;
  }
  const pwdError = validatePassword(password ?? '');
  if (pwdError) { res.status(400).json({ error: pwdError }); return; }

  // Bloqueia cadastro com email vinculado a conta banida
  const { data: emailOwner } = await supabase
    .from('players')
    .select('blocked')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (emailOwner?.blocked) {
    res.status(403).json({ error: 'Este email pertence a uma conta banida e não pode ser utilizado para criar uma nova conta.' });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(password!, 10);

    const { data: inserted, error } = await supabase
      .from('players')
      .insert([{
        nick:               nick.trim(),
        email:              email.trim().toLowerCase(),
        password_hash,
        twitch_url:         normalizeUrl(twitch_url),
        youtube_url:        normalizeUrl(youtube_url),
        kick_url:           normalizeUrl(kick_url),
        tiktok_url:         normalizeUrl(tiktok_url),
        status:             'pending',
        blocked:            false,
        terms_accepted_at:  new Date().toISOString(),
      }])
      .select('id')
      .single();

    if (error) {
      const { httpStatus, message } = dbError(error);
      let msg = message;
      if (error.code === '23505') {
        msg = (error.message ?? '').toLowerCase().includes('email')
          ? 'Este email já está cadastrado.'
          : 'Este nick já está cadastrado.';
      }
      res.status(httpStatus).json({ error: msg });
      return;
    }

    const newPlayerId = (inserted as { id: number }).id;
    const otpCode = String(100000 + crypto.randomInt(900000));
    await supabase.from('player_tokens').insert([{
      player_id:  newPlayerId,
      token:      `${newPlayerId}_otp_${otpCode}`,
      type:       'otp',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }]);

    try {
      await sendOtpEmail(email.trim().toLowerCase(), nick.trim(), otpCode, 'verify_email');
    } catch (emailErr) {
      console.error('[POST /players/register] Falha ao enviar OTP:', emailErr);
      res.status(201).json({
        message: 'Cadastro criado! Houve um problema ao enviar o email de verificação — use "Reenviar código" na tela de confirmação.',
        email_failed: true,
      });
      return;
    }

    res.status(201).json({
      message: 'Cadastro recebido! Verifique seu email para confirmar a conta.',
    });
  } catch (err) {
    console.error('[POST /players/register] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao salvar cadastro. Tente novamente.' });
  }
});

// GET /players?status=pending|approved|rejected|blocked|deleted|all — moderador
router.get('/', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const statusParam = typeof req.query.status === 'string' ? req.query.status : 'all';

  try {
    let query = supabase
      .from('players')
      .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, blocked, blocked_reason, blocked_at, blocked_by, blocked_note, is_supporter, supporter_until, is_featured_streamer, is_moderator, deleted_at, created_at')
      .order('created_at', { ascending: false });

    if (statusParam === 'deleted') {
      query = query.not('deleted_at', 'is', null);
    } else if (statusParam === 'blocked') {
      query = query.eq('blocked', true).is('deleted_at', null);
    } else if (statusParam === 'supporter') {
      query = query.eq('is_supporter', true).is('deleted_at', null);
    } else if (statusParam === 'all') {
      query = query.is('deleted_at', null);
    } else {
      query = query.eq('status', statusParam as PlayerStatus).is('deleted_at', null);
    }

    const { data, error } = await query;
    if (error) {
      const { httpStatus, message } = dbError(error);
      res.status(httpStatus).json({ error: message });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('[GET /players] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar jogadores.' });
  }
});

// PATCH /players/:id/email — moderador: define/atualiza o email de um jogador legado e envia convite de ativação
router.patch('/:id/email', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { email } = req.body as { email?: string };
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }

  try {
    const { data: player, error } = await supabase
      .from('players')
      .update({ email: email.trim().toLowerCase(), email_verified_at: null })
      .eq('id', id)
      .select('id, nick, email')
      .single();

    if (error) {
      const { httpStatus, message } = dbError(error);
      const msg = error.code === '23505' ? 'Este email já está cadastrado para outro jogador.' : message;
      res.status(httpStatus).json({ error: msg });
      return;
    }

    const row = player as { id: number; nick: string; email: string };

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await supabase.from('player_tokens').insert([{
      player_id:  row.id,
      token,
      type:       'activate',
      expires_at: expiresAt,
    }]);

    try {
      await sendActivationEmail(row.email, row.nick, token);
    } catch (emailErr) {
      console.error('[PATCH /players/:id/email] Falha ao enviar email de ativação:', emailErr);
      res.json({ message: 'Email salvo, mas falha ao enviar convite de ativação. Verifique o email e tente novamente.', email_failed: true });
      return;
    }

    res.json({ message: 'Email salvo e convite de ativação enviado.' });
  } catch (err) {
    console.error('[PATCH /players/:id/email] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao salvar email.' });
  }
});

// PATCH /players/:id/status — moderador
router.patch('/:id/status', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }

  const { status } = req.body as { status?: PlayerStatus };
  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Status deve ser "approved" ou "rejected".' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ status })
      .eq('id', id)
      .select('id, nick, email, status')
      .single();

    if (error) {
      const { httpStatus, message } = dbError(error);
      res.status(httpStatus).json({ error: message });
      return;
    }

    const row = data as { id: number; nick: string; email?: string | null; status: string };

    if (status === 'approved') {
      // Notifica o jogador por email
      if (row.email) {
        await sendApprovalEmail(row.email, row.nick).catch(err =>
          console.error('[PATCH /players/:id/status] Falha ao enviar email de aprovação:', err)
        );
      }

      // Inscreve no YouTube Pub/Sub se o jogador tem youtube_url cadastrado
      const { data: playerData } = await supabase
        .from('players')
        .select('youtube_url, yt_channel_id')
        .eq('id', id)
        .single();

      const ytUrl = (playerData as { youtube_url?: string | null } | null)?.youtube_url;
      const existingChannelId = (playerData as { yt_channel_id?: string | null } | null)?.yt_channel_id;

      if (ytUrl && !existingChannelId) {
        const { extractChannelId, subscribePubSub } = await import('../lib/youtube');
        const channelId = await extractChannelId(ytUrl);
        if (channelId) {
          const sub = await subscribePubSub(channelId);
          await supabase
            .from('players')
            .update({
              yt_channel_id:     channelId,
              yt_sub_expires_at: sub.ok ? sub.expiresAt : null,
            })
            .eq('id', id);
          if (!sub.ok) console.warn(`[players/status] Falha ao inscrever ${channelId}: ${sub.error}`);
        }
      }
    }

    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/status] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar status do jogador.' });
  }
});

// PATCH /players/:id/block — moderador
router.patch('/:id/block', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { reason, note } = req.body as { reason?: string; note?: string };
  if (!reason?.trim()) {
    res.status(400).json({ error: 'Motivo do banimento é obrigatório.' });
    return;
  }

  try {
    // Busca o login do moderador para registrar quem aplicou o ban
    const { data: mod } = await supabase
      .from('moderators')
      .select('login')
      .eq('id', req.userId!)
      .single();

    const { data, error } = await supabase
      .from('players')
      .update({
        blocked:        true,
        blocked_reason: reason.trim(),
        blocked_at:     new Date().toISOString(),
        blocked_by:     mod?.login ?? req.userId ?? 'moderador',
        blocked_note:   note?.trim() || null,
      })
      .eq('id', id)
      .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, blocked, blocked_reason, blocked_at, blocked_by, blocked_note, deleted_at, created_at')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/block] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao banir jogador.' });
  }
});

// PATCH /players/:id/unblock — moderador
router.patch('/:id/unblock', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({
        blocked:        false,
        blocked_reason: null,
        blocked_at:     null,
        blocked_by:     null,
        blocked_note:   null,
      })
      .eq('id', id)
      .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, blocked, blocked_reason, blocked_at, blocked_by, blocked_note, deleted_at, created_at')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/unblock] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao desbanir jogador.' });
  }
});

// PATCH /players/:id/links — moderador: atualiza links de canais do jogador
router.patch('/:id/links', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { twitch_url, youtube_url, kick_url, tiktok_url } = req.body as {
    twitch_url?:  string | null;
    youtube_url?: string | null;
    kick_url?:    string | null;
    tiktok_url?:  string | null;
  };

  try {
    const { data, error } = await supabase
      .from('players')
      .update({
        twitch_url:  normalizeUrl(twitch_url),
        youtube_url: normalizeUrl(youtube_url),
        kick_url:    normalizeUrl(kick_url),
        tiktok_url:  normalizeUrl(tiktok_url),
      })
      .eq('id', id)
      .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, blocked, deleted_at, created_at')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/links] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar links do jogador.' });
  }
});

// PATCH /players/:id/delete — moderador: soft-delete
router.patch('/:id/delete', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, blocked, deleted_at, created_at')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/delete] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao excluir jogador.' });
  }
});

// PATCH /players/:id/verify-email — moderador: marca email_verified_at manualmente
router.patch('/:id/verify-email', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ email_verified_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, nick, email_verified_at')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/verify-email] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao verificar email.' });
  }
});

// PATCH /players/:id/restore — moderador: restaura soft-delete
router.patch('/:id/restore', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ deleted_at: null })
      .eq('id', id)
      .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, blocked, deleted_at, created_at')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/restore] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao restaurar jogador.' });
  }
});

// PATCH /players/:id/test-mod — moderador: define/remove tag de moderador de teste no rank
router.patch('/:id/test-mod', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { is_test_mod } = req.body as { is_test_mod?: boolean };
  if (typeof is_test_mod !== 'boolean') {
    res.status(400).json({ error: 'is_test_mod deve ser true ou false.' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ is_test_mod })
      .eq('id', id)
      .select('id, nick, is_test_mod')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/test-mod] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar moderador de teste.' });
  }
});

// PATCH /players/:id/featured-streamer — moderador: define/remove destaque na home page
router.patch('/:id/featured-streamer', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { is_featured_streamer } = req.body as { is_featured_streamer?: boolean };
  if (typeof is_featured_streamer !== 'boolean') {
    res.status(400).json({ error: 'is_featured_streamer deve ser true ou false.' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ is_featured_streamer })
      .eq('id', id)
      .select('id, nick, is_featured_streamer')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/featured-streamer] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar destaque de streamer.' });
  }
});

// PATCH /players/:id/moderator — moderador: define/remove cargo de moderador
// oficial no jogador. Diferente de is_test_mod (moderador de teste): o
// jogador continua participando normalmente da numeração do rank público —
// o cargo só concede acessos extras (ex: overlay de OBS).
router.patch('/:id/moderator', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { is_moderator } = req.body as { is_moderator?: boolean };
  if (typeof is_moderator !== 'boolean') {
    res.status(400).json({ error: 'is_moderator deve ser true ou false.' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ is_moderator })
      .eq('id', id)
      .select('id, nick, is_moderator')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/moderator] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar cargo de moderador.' });
  }
});

// PATCH /players/:id/supporter — master: marca/desmarca apoiador
router.patch('/:id/supporter', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { is_supporter, supporter_until } = req.body as { is_supporter?: boolean; supporter_until?: string | null };

  try {
    const { data, error } = await supabase
      .from('players')
      .update({
        is_supporter:   is_supporter ?? true,
        supporter_until: supporter_until ?? null,
      })
      .eq('id', id)
      .select('id, nick, is_supporter, supporter_until')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/supporter] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar apoiador.' });
  }
});

export default router;

import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requireModerator } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';
import type { PlayerStatus } from '../types';
import { sendOtpEmail, sendApprovalEmail, sendActivationEmail } from '../lib/email';

const router = Router();

// Normaliza URLs de canal: adiciona https:// se o protocolo estiver ausente.
// Retorna null para strings vazias ou inválidas.
function normalizeUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

// GET /players/:id — público: retorna dados do jogador + todas as entradas dele no rank
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const [playerRes, entriesRes] = await Promise.all([
    supabase
      .from('players')
      .select('id, nick, twitch_url, youtube_url, kick_url, tiktok_url')
      .eq('id', id)
      .single(),
    supabase
      .from('entries')
      .select('*')
      .eq('player_id', id)
      .order('score', { ascending: false }),
  ]);

  if (playerRes.error || !playerRes.data) {
    res.status(404).json({ error: 'Jogador não encontrado.' });
    return;
  }

  res.json({ player: playerRes.data, entries: entriesRes.data ?? [] });
});

// POST /players/register — público
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { nick, email, password, twitch_url, youtube_url, kick_url, tiktok_url } = req.body as {
    nick?:        string;
    email?:       string;
    password?:    string;
    twitch_url?:  string;
    youtube_url?: string;
    kick_url?:    string;
    tiktok_url?:  string;
  };

  if (!nick?.trim()) {
    res.status(400).json({ error: 'Nick do jogador é obrigatório.' });
    return;
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const { data: player, error } = await supabase
      .from('players')
      .insert([{
        nick:          nick.trim(),
        email:         email.trim().toLowerCase(),
        password_hash,
        twitch_url:    normalizeUrl(twitch_url),
        youtube_url:   normalizeUrl(youtube_url),
        kick_url:      normalizeUrl(kick_url),
        tiktok_url:    normalizeUrl(tiktok_url),
        status:        'pending',
        blocked:       false,
      }])
      .select('id, nick, email')
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

    const playerRow = player as { id: number; nick: string; email: string };

    // Gera OTP de 6 dígitos para verificação de email (expira em 10 min)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const otpToken = `${playerRow.id}_otp_${code}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('player_tokens').insert([{
      player_id:  playerRow.id,
      token:      otpToken,
      type:       'otp',
      expires_at: expiresAt,
    }]);

    sendOtpEmail(playerRow.email, playerRow.nick, code, 'verify_email').catch(err =>
      console.error('[register] Falha ao enviar OTP:', err)
    );

    res.status(201).json({
      message: 'Cadastro recebido. Um código de 6 dígitos foi enviado para o seu email.',
      email: playerRow.email,
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
      .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, blocked, deleted_at, created_at')
      .order('created_at', { ascending: false });

    if (statusParam === 'deleted') {
      query = query.not('deleted_at', 'is', null);
    } else if (statusParam === 'blocked') {
      query = query.eq('blocked', true).is('deleted_at', null);
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

    sendActivationEmail(row.email, row.nick, token).catch(err =>
      console.error('[PATCH /players/:id/email] Falha ao enviar email de ativação:', err)
    );

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

    // Notifica o jogador por email quando aprovado (se tiver email cadastrado)
    const row = data as { id: number; nick: string; email?: string | null; status: string };
    if (status === 'approved' && row.email) {
      sendApprovalEmail(row.email, row.nick).catch(err =>
        console.error('[PATCH /players/:id/status] Falha ao enviar email de aprovação:', err)
      );
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

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ blocked: true })
      .eq('id', id)
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/block] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao bloquear jogador.' });
  }
});

// PATCH /players/:id/unblock — moderador
router.patch('/:id/unblock', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ blocked: false })
      .eq('id', id)
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/unblock] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao desbloquear jogador.' });
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
      .select()
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
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/delete] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao excluir jogador.' });
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
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/restore] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao restaurar jogador.' });
  }
});

export default router;

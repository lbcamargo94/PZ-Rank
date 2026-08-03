import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requireModerator, requireMaster } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';
import type { PlayerStatus } from '../types';
import { sendApprovalEmail, sendActivationEmail, sendOtpEmail } from '../lib/email';
import { validatePassword } from '../lib/password';

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

  if (playerRes.error) {
    // PGRST116 = zero rows — jogador não existe
    if (playerRes.error.code === 'PGRST116') {
      res.status(404).json({ error: 'Jogador não encontrado.' });
    } else {
      res.status(500).json({ error: 'Erro ao buscar dados do jogador.' });
    }
    return;
  }
  if (!playerRes.data) {
    res.status(404).json({ error: 'Jogador não encontrado.' });
    return;
  }

  res.json({ player: playerRes.data, entries: entriesRes.data ?? [] });
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
      .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, blocked, is_supporter, supporter_until, deleted_at, created_at')
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

    // Notifica o jogador por email quando aprovado (se tiver email cadastrado)
    const row = data as { id: number; nick: string; email?: string | null; status: string };
    if (status === 'approved' && row.email) {
      await sendApprovalEmail(row.email, row.nick).catch(err =>
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
      .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, blocked, deleted_at, created_at')
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
      .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, blocked, deleted_at, created_at')
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

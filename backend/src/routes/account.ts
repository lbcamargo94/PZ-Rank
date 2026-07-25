import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requirePlayer } from '../middleware/player';
import type { PlayerRequest } from '../middleware/player';
import { sendVerificationEmail } from '../lib/email';

const router = Router();

function normalizeUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

// GET /account/me — perfil próprio do jogador autenticado
router.get('/me', requirePlayer, async (req: PlayerRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('players')
    .select('id, nick, email, email_verified_at, twitch_url, youtube_url, kick_url, tiktok_url, status, created_at')
    .eq('id', req.playerId!)
    .single();

  if (error || !data) { res.status(404).json({ error: 'Jogador não encontrado.' }); return; }
  res.json(data);
});

// GET /account/me/entries — runs próprias do jogador
router.get('/me/entries', requirePlayer, async (req: PlayerRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('player_id', req.playerId!)
    .is('deleted_at', null)
    .order('score', { ascending: false });

  if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
  res.json(data ?? []);
});

// PATCH /account/me/password — trocar senha (exige senha atual)
router.patch('/me/password', requirePlayer, async (req: PlayerRequest, res: Response): Promise<void> => {
  const { current_password, new_password } = req.body as {
    current_password?: string;
    new_password?: string;
  };

  if (!current_password || !new_password) {
    res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    return;
  }
  if (new_password.length < 8) {
    res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
    return;
  }
  if (current_password === new_password) {
    res.status(400).json({ error: 'A nova senha deve ser diferente da atual.' });
    return;
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, password_hash')
    .eq('id', req.playerId!)
    .single();

  const row = player as { id: number; password_hash: string | null } | null;
  if (!row?.password_hash) {
    res.status(400).json({ error: 'Conta sem senha definida. Use "Esqueci minha senha" para criar uma.' });
    return;
  }

  const valid = await bcrypt.compare(current_password, row.password_hash);
  if (!valid) { res.status(401).json({ error: 'Senha atual incorreta.' }); return; }

  const password_hash = await bcrypt.hash(new_password, 10);
  await supabase.from('players').update({ password_hash }).eq('id', req.playerId!);

  res.json({ message: 'Senha alterada com sucesso.' });
});

// PATCH /account/me/email — trocar email (exige senha atual, envia verificação)
router.patch('/me/email', requirePlayer, async (req: PlayerRequest, res: Response): Promise<void> => {
  const { current_password, email } = req.body as {
    current_password?: string;
    email?: string;
  };

  if (!current_password || !email?.trim()) {
    res.status(400).json({ error: 'Senha atual e novo email são obrigatórios.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, nick, email, password_hash')
    .eq('id', req.playerId!)
    .single();

  const row = player as { id: number; nick: string; email: string; password_hash: string | null } | null;
  if (!row?.password_hash) {
    res.status(400).json({ error: 'Conta sem senha definida.' });
    return;
  }

  const newEmail = email.trim().toLowerCase();
  if (row.email === newEmail) {
    res.status(400).json({ error: 'O novo email deve ser diferente do atual.' });
    return;
  }

  const valid = await bcrypt.compare(current_password, row.password_hash);
  if (!valid) { res.status(401).json({ error: 'Senha atual incorreta.' }); return; }

  const { error: updateError } = await supabase
    .from('players')
    .update({ email: newEmail, email_verified_at: null })
    .eq('id', req.playerId!);

  if (updateError) {
    const e = dbError(updateError);
    const msg = updateError.code === '23505' ? 'Este email já está cadastrado por outro jogador.' : e.message;
    res.status(e.httpStatus).json({ error: msg });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('player_tokens').insert([{
    player_id: req.playerId!, token, type: 'verify', expires_at: expiresAt,
  }]);

  sendVerificationEmail(newEmail, row.nick, token).catch(err =>
    console.error('[PATCH /account/me/email] Falha ao enviar email:', err)
  );

  res.json({ message: 'Email atualizado. Verifique sua caixa de entrada para confirmar o novo endereço.' });
});

// PATCH /account/me/links — atualizar links de redes sociais
router.patch('/me/links', requirePlayer, async (req: PlayerRequest, res: Response): Promise<void> => {
  const { twitch_url, youtube_url, kick_url, tiktok_url } = req.body as {
    twitch_url?:  string | null;
    youtube_url?: string | null;
    kick_url?:    string | null;
    tiktok_url?:  string | null;
  };

  const { data, error } = await supabase
    .from('players')
    .update({
      twitch_url:  normalizeUrl(twitch_url),
      youtube_url: normalizeUrl(youtube_url),
      kick_url:    normalizeUrl(kick_url),
      tiktok_url:  normalizeUrl(tiktok_url),
    })
    .eq('id', req.playerId!)
    .select('id, twitch_url, youtube_url, kick_url, tiktok_url')
    .single();

  if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
  res.json(data);
});

export default router;

import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requirePlayer } from '../middleware/player';
import type { PlayerRequest } from '../middleware/player';
import { sendVerificationEmail, sendOtpEmail } from '../lib/email';
import { validatePassword } from '../lib/password';

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
  const changePwdErr = validatePassword(new_password);
  if (changePwdErr) { res.status(400).json({ error: changePwdErr }); return; }
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

  await sendVerificationEmail(newEmail, row.nick, token).catch(err =>
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

// POST /account/me/otp/send — envia OTP para confirmar troca de email ou senha
router.post('/me/otp/send', requirePlayer, async (req: PlayerRequest, res: Response): Promise<void> => {
  const { action, new_email, current_password, new_password } = req.body as {
    action?: string;
    new_email?: string;
    current_password?: string;
    new_password?: string;
  };

  if (action !== 'change_email' && action !== 'change_password') {
    res.status(400).json({ error: 'Ação inválida.' });
    return;
  }

  // Busca dados do player (email atual + password_hash)
  const { data: player } = await supabase
    .from('players')
    .select('id, nick, email, password_hash')
    .eq('id', req.playerId!)
    .single();

  const row = player as { id: number; nick: string; email: string; password_hash: string | null } | null;
  if (!row?.password_hash) {
    res.status(400).json({ error: 'Conta sem senha. Use "Esqueci minha senha" para criar uma.' });
    return;
  }

  if (!current_password) {
    res.status(400).json({ error: 'Senha atual é obrigatória.' });
    return;
  }

  const validPass = await bcrypt.compare(current_password, row.password_hash);
  if (!validPass) {
    res.status(401).json({ error: 'Senha atual incorreta.' });
    return;
  }

  let targetEmail = row.email;

  if (action === 'change_email') {
    if (!new_email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(new_email.trim())) {
      res.status(400).json({ error: 'Novo email inválido.' });
      return;
    }
    const normalized = new_email.trim().toLowerCase();
    if (normalized === row.email) {
      res.status(400).json({ error: 'O novo email deve ser diferente do atual.' });
      return;
    }
    // Verifica se email já está em uso
    const { data: existing } = await supabase
      .from('players').select('id').eq('email', normalized).neq('id', row.id).maybeSingle();
    if (existing) {
      res.status(400).json({ error: 'Este email já está cadastrado por outro jogador.' });
      return;
    }
    targetEmail = normalized; // envia OTP para o NOVO email
  }

  if (action === 'change_password') {
    const otpPwdErr = validatePassword(new_password ?? '');
    if (otpPwdErr) { res.status(400).json({ error: otpPwdErr }); return; }
    if (current_password === new_password) {
      res.status(400).json({ error: 'A nova senha deve ser diferente da atual.' });
      return;
    }
  }

  // Gera OTP e armazena
  const code = String(100000 + crypto.randomInt(900000));
  const otpToken = `${row.id}_otp_${code}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase.from('player_tokens').insert([{
    player_id:  row.id,
    token:      otpToken,
    type:       'otp',
    expires_at: expiresAt,
  }]);

  const emailAction = action === 'change_email' ? 'change_email' : 'change_password';
  await sendOtpEmail(targetEmail, row.nick, code, emailAction).catch(err =>
    console.error(`[otp/send ${action}] Falha ao enviar OTP:`, err)
  );

  // Mascara o email para exibição
  const [user, domain] = targetEmail.split('@');
  const masked = `${user.slice(0, 2)}***@${domain}`;

  res.json({ message: `Código enviado para ${masked}. Ele expira em 10 minutos.` });
});

// POST /account/me/otp/confirm — verifica OTP e aplica mudança de email ou senha
router.post('/me/otp/confirm', requirePlayer, async (req: PlayerRequest, res: Response): Promise<void> => {
  const { action, code, current_password, new_email, new_password } = req.body as {
    action?: string;
    code?: string;
    current_password?: string;
    new_email?: string;
    new_password?: string;
  };

  if (action !== 'change_email' && action !== 'change_password') {
    res.status(400).json({ error: 'Ação inválida.' });
    return;
  }
  if (!code?.trim() || !/^\d{6}$/.test(code.trim())) {
    res.status(400).json({ error: 'Código de 6 dígitos é obrigatório.' });
    return;
  }

  const now = new Date().toISOString();

  // Revalida senha atual (defesa em profundidade)
  const { data: player } = await supabase
    .from('players')
    .select('id, nick, email, password_hash')
    .eq('id', req.playerId!)
    .single();

  const row = player as { id: number; nick: string; email: string; password_hash: string | null } | null;
  if (!row?.password_hash) {
    res.status(400).json({ error: 'Conta sem senha.' });
    return;
  }

  if (!current_password) {
    res.status(400).json({ error: 'Senha atual é obrigatória.' });
    return;
  }

  const validPass = await bcrypt.compare(current_password, row.password_hash);
  if (!validPass) {
    res.status(401).json({ error: 'Senha atual incorreta.' });
    return;
  }

  // Verifica OTP
  const otpToken = `${row.id}_otp_${code.trim()}`;
  const { data: tokenRow } = await supabase
    .from('player_tokens')
    .select('id, expires_at, used_at')
    .eq('token', otpToken)
    .eq('type', 'otp')
    .eq('player_id', row.id)
    .maybeSingle();

  const otp = tokenRow as { id: number; expires_at: string; used_at: string | null } | null;

  if (!otp || otp.used_at || now > otp.expires_at) {
    res.status(400).json({ error: 'Código inválido ou expirado.' });
    return;
  }

  // Marca OTP como usado
  await supabase.from('player_tokens').update({ used_at: now }).eq('id', otp.id);

  if (action === 'change_email') {
    if (!new_email?.trim()) {
      res.status(400).json({ error: 'Novo email é obrigatório.' });
      return;
    }
    const normalized = new_email.trim().toLowerCase();

    const { error: updateError } = await supabase
      .from('players')
      .update({ email: normalized, email_verified_at: now })
      .eq('id', row.id);

    if (updateError) {
      const e = dbError(updateError);
      const msg = updateError.code === '23505' ? 'Este email já está cadastrado por outro jogador.' : e.message;
      res.status(e.httpStatus).json({ error: msg });
      return;
    }

    res.json({ message: 'Email atualizado e verificado com sucesso.' });
    return;
  }

  if (action === 'change_password') {
    if (!new_password || new_password.length < 8) {
      res.status(400).json({ error: 'Nova senha deve ter no mínimo 8 caracteres.' });
      return;
    }
    if (current_password === new_password) {
      res.status(400).json({ error: 'A nova senha deve ser diferente da atual.' });
      return;
    }
    const password_hash = await bcrypt.hash(new_password, 10);
    await supabase.from('players').update({ password_hash }).eq('id', row.id);
    res.json({ message: 'Senha alterada com sucesso.' });
    return;
  }
});

export default router;

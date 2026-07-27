import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { supabase } from '../supabase';
import { sendPasswordResetEmail, sendVerificationEmail, sendOtpEmail } from '../lib/email';
import { validatePassword } from '../lib/password';

const router = Router();

// GET /auth/player/verify?token=XXX — verifica email do jogador
router.get('/verify', async (req: Request, res: Response): Promise<void> => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  if (!token) {
    res.status(400).json({ error: 'Token inválido.' });
    return;
  }

  const now = new Date().toISOString();

  const { data: tokenRow, error: tokenError } = await supabase
    .from('player_tokens')
    .select('id, player_id, expires_at, used_at')
    .eq('token', token)
    .eq('type', 'verify')
    .maybeSingle();

  if (tokenError || !tokenRow) {
    res.status(400).json({ error: 'Token inválido ou não encontrado.' });
    return;
  }

  const row = tokenRow as { id: number; player_id: number; expires_at: string; used_at: string | null };

  if (row.used_at) {
    res.status(400).json({ error: 'Token já utilizado.' });
    return;
  }
  if (now > row.expires_at) {
    res.status(400).json({ error: 'Token expirado.' });
    return;
  }

  // Marca token como usado e verifica o email do jogador
  await Promise.all([
    supabase.from('player_tokens').update({ used_at: now }).eq('id', row.id),
    supabase.from('players').update({ email_verified_at: now, status: 'approved' }).eq('id', row.player_id),
  ]);

  res.json({ message: 'Email verificado com sucesso! Sua conta já está ativa.' });
});

// POST /auth/player/resend-verification — reenvia email de verificação
router.post('/resend-verification', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) {
    res.status(400).json({ error: 'Email é obrigatório.' });
    return;
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, nick, email, email_verified_at')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  // Resposta genérica para não revelar se o email existe
  if (!player || (player as { email_verified_at?: string | null }).email_verified_at) {
    res.json({ message: 'Se o email existir e ainda não estiver verificado, um novo link foi enviado.' });
    return;
  }

  const row = player as { id: number; nick: string; email: string };
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('player_tokens').insert([{
    player_id:  row.id,
    token,
    type:       'verify',
    expires_at: expiresAt,
  }]);

  await sendVerificationEmail(row.email, row.nick, token).catch(err =>
    console.error('[resend-verification] Falha ao enviar email:', err)
  );

  res.json({ message: 'Se o email existir e ainda não estiver verificado, um novo link foi enviado.' });
});

// POST /auth/player/login — email + senha → player_token
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    return;
  }

  const { data: player, error } = await supabase
    .from('players')
    .select('id, nick, email, password_hash, email_verified_at, status, blocked, deleted_at, player_token')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (error || !player) {
    res.status(401).json({ error: 'Email ou senha incorretos.' });
    return;
  }

  const row = player as {
    id: number; nick: string; email: string; password_hash: string | null;
    email_verified_at: string | null; status: string; blocked: boolean;
    deleted_at: string | null; player_token: string;
  };

  if (!row.password_hash) {
    res.status(401).json({ error: 'Esta conta não possui senha. Use o Companion com seu nick.' });
    return;
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Email ou senha incorretos.' });
    return;
  }

  if (!row.email_verified_at) {
    res.status(403).json({ error: 'Email não verificado. Verifique sua caixa de entrada.' });
    return;
  }
  if (row.deleted_at) {
    res.status(403).json({ error: 'Conta removida do ranking.' });
    return;
  }
  if (row.blocked) {
    res.status(403).json({ error: 'Conta bloqueada. Contate um moderador.' });
    return;
  }
  if (row.status !== 'approved') {
    res.status(403).json({ error: 'Conta aguardando aprovação de um moderador.' });
    return;
  }

  res.json({ player_token: row.player_token, player_id: row.id, nick: row.nick });
});

// POST /auth/player/forgot-password — solicita redefinição de senha
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) {
    res.status(400).json({ error: 'Email é obrigatório.' });
    return;
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, nick, email, password_hash')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  // Resposta genérica para não revelar se o email existe
  const GENERIC = { message: 'Se o email estiver cadastrado, você receberá as instruções em breve.' };

  if (!player || !(player as { password_hash?: string | null }).password_hash) {
    res.json(GENERIC);
    return;
  }

  const row = player as { id: number; nick: string; email: string };
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

  await supabase.from('player_tokens').insert([{
    player_id:  row.id,
    token,
    type:       'reset',
    expires_at: expiresAt,
  }]);

  await sendPasswordResetEmail(row.email, row.nick, token).catch(err =>
    console.error('[forgot-password] Falha ao enviar email:', err)
  );

  res.json(GENERIC);
});

// POST /auth/player/activate — ativa conta legada (primeiro acesso, define senha via token do moderador)
router.post('/activate', async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token?.trim()) { res.status(400).json({ error: 'Token é obrigatório.' }); return; }
  const activateErr = validatePassword(password ?? '');
  if (activateErr) { res.status(400).json({ error: activateErr }); return; }

  const now = new Date().toISOString();

  const { data: tokenRow, error: tokenError } = await supabase
    .from('player_tokens')
    .select('id, player_id, expires_at, used_at')
    .eq('token', token.trim())
    .eq('type', 'activate')
    .maybeSingle();

  if (tokenError || !tokenRow) {
    res.status(400).json({ error: 'Link inválido ou não encontrado.' });
    return;
  }

  const row = tokenRow as { id: number; player_id: number; expires_at: string; used_at: string | null };

  if (row.used_at) {
    res.status(400).json({ error: 'Este link já foi utilizado.' });
    return;
  }
  if (now > row.expires_at) {
    res.status(400).json({ error: 'Link expirado. Solicite um novo link de ativação a um moderador.' });
    return;
  }

  const password_hash = await bcrypt.hash(password!, 10);

  await Promise.all([
    supabase.from('player_tokens').update({ used_at: now }).eq('id', row.id),
    supabase.from('players').update({ password_hash, email_verified_at: now, status: 'approved' }).eq('id', row.player_id),
  ]);

  res.json({ message: 'Conta ativada com sucesso! Agora faça login no Companion com seu email e senha.' });
});

// POST /auth/player/reset-password — redefine senha com token
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token?.trim()) { res.status(400).json({ error: 'Token é obrigatório.' }); return; }
  const resetErr = validatePassword(password ?? '');
  if (resetErr) { res.status(400).json({ error: resetErr }); return; }

  const now = new Date().toISOString();

  const { data: tokenRow, error: tokenError } = await supabase
    .from('player_tokens')
    .select('id, player_id, expires_at, used_at')
    .eq('token', token.trim())
    .eq('type', 'reset')
    .maybeSingle();

  if (tokenError || !tokenRow) {
    res.status(400).json({ error: 'Token inválido ou não encontrado.' });
    return;
  }

  const row = tokenRow as { id: number; player_id: number; expires_at: string; used_at: string | null };

  if (row.used_at) {
    res.status(400).json({ error: 'Token já utilizado.' });
    return;
  }
  if (now > row.expires_at) {
    res.status(400).json({ error: 'Token expirado. Solicite um novo link.' });
    return;
  }

  const password_hash = await bcrypt.hash(password!, 10);

  await Promise.all([
    supabase.from('player_tokens').update({ used_at: now }).eq('id', row.id),
    supabase.from('players').update({ password_hash }).eq('id', row.player_id),
  ]);

  res.json({ message: 'Senha redefinida com sucesso!' });
});

// POST /auth/player/otp/confirm-registration — verifica OTP de cadastro
router.post('/otp/confirm-registration', async (req: Request, res: Response): Promise<void> => {
  const { email, code } = req.body as { email?: string; code?: string };

  if (!email?.trim() || !code?.trim() || !/^\d{6}$/.test(code.trim())) {
    res.status(400).json({ error: 'Email e código de 6 dígitos são obrigatórios.' });
    return;
  }

  const now = new Date().toISOString();

  const { data: player } = await supabase
    .from('players')
    .select('id, nick, email_verified_at')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  const playerRow = player as { id: number; nick: string; email_verified_at: string | null } | null;
  if (!playerRow) {
    res.status(400).json({ error: 'Código inválido ou expirado.' });
    return;
  }

  if (playerRow.email_verified_at) {
    res.json({ message: 'Email já verificado. Faça login para acessar o ranking.' });
    return;
  }

  const otpToken = `${playerRow.id}_otp_${code.trim()}`;

  const { data: tokenRow } = await supabase
    .from('player_tokens')
    .select('id, expires_at, used_at')
    .eq('token', otpToken)
    .eq('type', 'otp')
    .eq('player_id', playerRow.id)
    .maybeSingle();

  const otp = tokenRow as { id: number; expires_at: string; used_at: string | null } | null;

  if (!otp || otp.used_at || now > otp.expires_at) {
    res.status(400).json({ error: 'Código inválido ou expirado.' });
    return;
  }

  await Promise.all([
    supabase.from('player_tokens').update({ used_at: now }).eq('id', otp.id),
    supabase.from('players').update({ email_verified_at: now, status: 'approved' }).eq('id', playerRow.id),
  ]);

  res.json({ message: 'Email verificado! Sua conta já está ativa.' });
});

// POST /auth/player/otp/resend-registration — reenvia OTP de cadastro
router.post('/otp/resend-registration', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  const GENERIC = { message: 'Se o email existir sem verificação, um novo código foi enviado.' };

  if (!email?.trim()) {
    res.status(400).json({ error: 'Email é obrigatório.' });
    return;
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, nick, email_verified_at')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  const playerRow = player as { id: number; nick: string; email_verified_at: string | null } | null;

  if (!playerRow || playerRow.email_verified_at) {
    res.json(GENERIC);
    return;
  }

  const code = String(100000 + crypto.randomInt(900000));
  const otpToken = `${playerRow.id}_otp_${code}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase.from('player_tokens').insert([{
    player_id:  playerRow.id,
    token:      otpToken,
    type:       'otp',
    expires_at: expiresAt,
  }]);

  await sendOtpEmail(email.trim().toLowerCase(), playerRow.nick, code, 'verify_email').catch(err =>
    console.error('[resend-registration-otp] Falha ao enviar:', err)
  );

  res.json(GENERIC);
});

// POST /auth/player/claim — jogador legado (sem email/senha) vincula email + senha sem OTP
router.post('/claim', async (req: Request, res: Response): Promise<void> => {
  const { nick, email } = req.body as { nick?: string; email?: string };

  const GENERIC = { message: 'Se o nick existir sem conta configurada, seu cadastro foi recebido.' };

  if (!nick?.trim() || !email?.trim()) {
    res.status(400).json({ error: 'Nick e email são obrigatórios.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }

  const newEmail = email.trim().toLowerCase();

  const { data: player } = await supabase
    .from('players')
    .select('id, nick, email, password_hash, deleted_at, blocked')
    .eq('nick', nick.trim())
    .maybeSingle();

  const row = player as {
    id: number; nick: string; email: string | null;
    password_hash: string | null; deleted_at: string | null; blocked: boolean;
  } | null;

  if (!row || row.deleted_at || row.blocked || row.email || row.password_hash) {
    res.json(GENERIC);
    return;
  }

  const { data: emailOwner } = await supabase
    .from('players')
    .select('id')
    .eq('email', newEmail)
    .neq('id', row.id)
    .maybeSingle();

  if (emailOwner) {
    res.json(GENERIC);
    return;
  }

  await supabase.from('players').update({
    email:  newEmail,
    status: 'pending',
  }).eq('id', row.id);

  const claimCode = String(100000 + crypto.randomInt(900000));
  await supabase.from('player_tokens').insert([{
    player_id:  row.id,
    token:      `${row.id}_otp_${claimCode}`,
    type:       'otp',
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }]);

  await sendOtpEmail(newEmail, row.nick, claimCode, 'verify_email').catch(err =>
    console.error('[claim] Falha ao enviar OTP:', err)
  );

  res.json({ otp_pending: true, email: newEmail, message: 'Verifique seu email para confirmar a vinculação.' });
});

// POST /auth/player/otp/resend-claim — reenvia OTP para jogador legado no fluxo de vinculação
router.post('/otp/resend-claim', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  const GENERIC = { message: 'Se o email tiver uma conta pendente de ativação, um novo código foi enviado.' };

  if (!email?.trim()) {
    res.status(400).json({ error: 'Email é obrigatório.' });
    return;
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, nick, password_hash')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  const row = player as { id: number; nick: string; password_hash: string | null } | null;

  if (!row || row.password_hash) {
    res.json(GENERIC);
    return;
  }

  const code = String(100000 + crypto.randomInt(900000));
  const otpToken = `${row.id}_otp_${code}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase.from('player_tokens').insert([{
    player_id:  row.id,
    token:      otpToken,
    type:       'otp',
    expires_at: expiresAt,
  }]);

  await sendOtpEmail(email.trim().toLowerCase(), row.nick, code, 'verify_email').catch(err =>
    console.error('[resend-claim-otp] Falha ao enviar:', err)
  );

  res.json(GENERIC);
});

// POST /auth/player/otp/confirm-claim — verifica OTP do claim e retorna token de ativação
router.post('/otp/confirm-claim', async (req: Request, res: Response): Promise<void> => {
  const { email, code } = req.body as { email?: string; code?: string };

  if (!email?.trim() || !code?.trim() || !/^\d{6}$/.test(code.trim())) {
    res.status(400).json({ error: 'Email e código de 6 dígitos são obrigatórios.' });
    return;
  }

  const now = new Date().toISOString();

  const { data: player } = await supabase
    .from('players')
    .select('id, nick, password_hash')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  const playerRow = player as { id: number; nick: string; password_hash: string | null } | null;

  if (!playerRow || playerRow.password_hash) {
    res.status(400).json({ error: 'Código inválido ou expirado.' });
    return;
  }

  const otpToken = `${playerRow.id}_otp_${code.trim()}`;

  const { data: tokenRow } = await supabase
    .from('player_tokens')
    .select('id, expires_at, used_at')
    .eq('token', otpToken)
    .eq('type', 'otp')
    .eq('player_id', playerRow.id)
    .maybeSingle();

  const otp = tokenRow as { id: number; expires_at: string; used_at: string | null } | null;

  if (!otp || otp.used_at || now > otp.expires_at) {
    res.status(400).json({ error: 'Código inválido ou expirado.' });
    return;
  }

  await supabase.from('player_tokens').update({ used_at: now }).eq('id', otp.id);

  // Gera token de ativação para definição de senha (30 min)
  const activateToken = crypto.randomBytes(32).toString('hex');
  const activateExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  await supabase.from('player_tokens').insert([{
    player_id:  playerRow.id,
    token:      activateToken,
    type:       'activate',
    expires_at: activateExpires,
  }]);

  res.json({ message: 'Código verificado!', activate_token: activateToken });
});

export default router;

import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { supabase } from '../supabase';
import { dbError, translateSupabaseError } from '../lib/errors';
import { requireModerator, requireMaster } from '../middleware/moderator';
import { sendModeratorInviteEmail, sendOtpEmail } from '../lib/email';
import { validatePassword } from '../lib/password';
import { config } from '../config';
import type { ModRequest } from '../middleware/moderator';

const router = Router();

// GET /moderators — moderador
router.get('/', requireModerator, async (_req: ModRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('moderators')
      .select('id, login, email, role, created_at')
      .order('created_at', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[GET /moderators] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar moderadores.' });
  }
});

// POST /moderators/invite — master: envia convite por email
router.post('/invite', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Verifica se email já está em uso
    const { data: existing } = await supabase
      .from('moderators')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: 'Este email já está cadastrado como moderador.' });
      return;
    }

    const inviteToken = crypto.randomUUID();
    const expiresAt   = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await supabase.from('moderator_tokens').insert([{
      email:      normalizedEmail,
      token:      inviteToken,
      type:       'invite',
      expires_at: expiresAt,
    }]);

    const inviteUrl = `${config.frontendUrl}/painel/convite/${inviteToken}`;

    try {
      await sendModeratorInviteEmail(normalizedEmail, inviteUrl);
    } catch (emailErr) {
      console.error('[POST /moderators/invite] Falha ao enviar email:', emailErr);
      res.status(500).json({ error: 'Não foi possível enviar o email de convite. Tente novamente.' });
      return;
    }

    res.json({ message: 'Convite enviado com sucesso.' });
  } catch (err) {
    console.error('[POST /moderators/invite] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao enviar convite.' });
  }
});

// GET /moderators/invite/:token — público: valida token e retorna email
router.get('/invite/:token', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const now = new Date().toISOString();

  try {
    const { data: tokenRow } = await supabase
      .from('moderator_tokens')
      .select('id, email, expires_at, used_at')
      .eq('token', token)
      .eq('type', 'invite')
      .maybeSingle();

    const row = tokenRow as { id: number; email: string; expires_at: string; used_at: string | null } | null;

    if (!row || row.used_at || now > row.expires_at) {
      res.status(410).json({ error: 'Este link de convite é inválido ou já expirou.' });
      return;
    }

    res.json({ email: row.email });
  } catch (err) {
    console.error('[GET /moderators/invite/:token] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao validar convite.' });
  }
});

// POST /moderators/register — público: conclui cadastro via convite, envia OTP
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { invite_token, login, password } = req.body as {
    invite_token?: string; login?: string; password?: string;
  };

  if (!invite_token?.trim() || !login?.trim() || !password) {
    res.status(400).json({ error: 'Token de convite, login e senha são obrigatórios.' });
    return;
  }

  const pwdError = validatePassword(password);
  if (pwdError) { res.status(400).json({ error: pwdError }); return; }

  const now = new Date().toISOString();

  try {
    const { data: tokenRow } = await supabase
      .from('moderator_tokens')
      .select('id, email, expires_at, used_at')
      .eq('token', invite_token.trim())
      .eq('type', 'invite')
      .maybeSingle();

    const inviteRow = tokenRow as { id: number; email: string; expires_at: string; used_at: string | null } | null;

    if (!inviteRow || inviteRow.used_at || now > inviteRow.expires_at) {
      res.status(410).json({ error: 'Este link de convite é inválido ou já expirou.' });
      return;
    }

    const email = inviteRow.email;

    // Verifica se já existe moderador com esse email
    const { data: existingMod } = await supabase
      .from('moderators')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingMod) {
      res.status(409).json({ error: 'Este email já possui uma conta de moderador.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data: newMod, error: insertError } = await supabase
      .from('moderators')
      .insert([{
        login:        login.trim().toLowerCase(),
        email,
        role:         'moderator',
        password_hash,
      }])
      .select('id, login')
      .single();

    if (insertError) {
      const msg = insertError.code === '23505'
        ? 'Este login já está em uso por outro moderador.'
        : translateSupabaseError(insertError.message);
      res.status(insertError.code === '23505' ? 409 : 500).json({ error: msg });
      return;
    }

    const mod = newMod as { id: string; login: string };

    // Marca o convite como usado
    await supabase.from('moderator_tokens').update({ used_at: now }).eq('id', inviteRow.id);

    // Gera e envia OTP
    const otpCode  = String(100000 + crypto.randomInt(900000));
    const otpToken = `${mod.id}_otp_${otpCode}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('moderator_tokens').insert([{
      email,
      token:      otpToken,
      type:       'otp',
      expires_at: expiresAt,
    }]);

    try {
      await sendOtpEmail(email, mod.login, otpCode, 'verify_email');
    } catch (emailErr) {
      console.error('[POST /moderators/register] Falha ao enviar OTP:', emailErr);
      res.status(201).json({
        message: 'Conta criada! Houve um problema ao enviar o código — use "Reenviar código" na tela de verificação.',
        email,
        email_failed: true,
      });
      return;
    }

    res.status(201).json({ message: 'Conta criada! Verifique seu email para ativar o acesso.', email });
  } catch (err) {
    console.error('[POST /moderators/register] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao criar conta de moderador.' });
  }
});

// POST /moderators/otp/confirm — público: confirma OTP e ativa conta
router.post('/otp/confirm', async (req: Request, res: Response): Promise<void> => {
  const { email, code } = req.body as { email?: string; code?: string };

  if (!email?.trim() || !code?.trim() || !/^\d{6}$/.test(code.trim())) {
    res.status(400).json({ error: 'Email e código de 6 dígitos são obrigatórios.' });
    return;
  }

  const now = new Date().toISOString();

  try {
    const { data: mod } = await supabase
      .from('moderators')
      .select('id, email_verified_at')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    const modRow = mod as { id: string; email_verified_at: string | null } | null;

    if (!modRow) {
      res.status(400).json({ error: 'Código inválido ou expirado.' });
      return;
    }

    if (modRow.email_verified_at) {
      res.json({ message: 'Conta já verificada. Faça login para acessar o painel.' });
      return;
    }

    const otpToken = `${modRow.id}_otp_${code.trim()}`;

    const { data: tokenRow } = await supabase
      .from('moderator_tokens')
      .select('id, expires_at, used_at')
      .eq('token', otpToken)
      .eq('type', 'otp')
      .maybeSingle();

    const otp = tokenRow as { id: number; expires_at: string; used_at: string | null } | null;

    if (!otp || otp.used_at || now > otp.expires_at) {
      res.status(400).json({ error: 'Código inválido ou expirado.' });
      return;
    }

    await Promise.all([
      supabase.from('moderator_tokens').update({ used_at: now }).eq('id', otp.id),
      supabase.from('moderators').update({ email_verified_at: now }).eq('id', modRow.id),
    ]);

    res.json({ message: 'Conta de moderador ativada com sucesso!' });
  } catch (err) {
    console.error('[POST /moderators/otp/confirm] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao confirmar código.' });
  }
});

// POST /moderators/otp/resend — público: reenvia OTP de ativação
router.post('/otp/resend', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  const GENERIC = { message: 'Se o email existir sem verificação, um novo código foi enviado.' };

  if (!email?.trim()) {
    res.status(400).json({ error: 'Email é obrigatório.' });
    return;
  }

  try {
    const { data: mod } = await supabase
      .from('moderators')
      .select('id, login, email_verified_at')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    const modRow = mod as { id: string; login: string; email_verified_at: string | null } | null;

    if (!modRow) { res.json(GENERIC); return; }

    if (modRow.email_verified_at) {
      res.status(409).json({ error: 'already_verified', message: 'Esta conta já está verificada. Faça login normalmente.' });
      return;
    }

    const otpCode  = String(100000 + crypto.randomInt(900000));
    const otpToken = `${modRow.id}_otp_${otpCode}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('moderator_tokens').insert([{
      email:      email.trim().toLowerCase(),
      token:      otpToken,
      type:       'otp',
      expires_at: expiresAt,
    }]);

    try {
      await sendOtpEmail(email.trim().toLowerCase(), modRow.login, otpCode, 'verify_email');
    } catch (err) {
      console.error('[POST /moderators/otp/resend] Falha ao enviar:', err);
      res.status(500).json({ error: 'Não foi possível enviar o email. Tente novamente em instantes.' });
      return;
    }

    res.json(GENERIC);
  } catch (err) {
    console.error('[POST /moderators/otp/resend] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao reenviar código.' });
  }
});

// DELETE /moderators/:id — master
router.delete('/:id', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const targetId = String(req.params.id);

  if (targetId === req.userId) {
    res.status(400).json({ error: 'Você não pode remover sua própria conta de moderador.' });
    return;
  }

  try {
    const { data: target } = await supabase
      .from('moderators')
      .select('role')
      .eq('id', targetId)
      .single();

    if ((target as { role: string } | null)?.role === 'master') {
      res.status(400).json({ error: 'Não é possível remover outro moderador master.' });
      return;
    }

    const { error } = await supabase.from('moderators').delete().eq('id', targetId);
    if (error) {
      const e = dbError(error);
      res.status(e.httpStatus).json({ error: e.message });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /moderators/:id] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao remover moderador.' });
  }
});

export default router;

import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '../supabase';

import { validatePassword } from '../lib/password';
import { sendModPasswordResetEmail } from '../lib/email';
import { config } from '../config';
import type { ModeratorRole } from '../types';

const router = Router();

const MOD_COOKIE_NAME  = 'mod_session';
const MOD_COOKIE_30D_MS = 30 * 24 * 60 * 60 * 1000;
const IS_PROD          = process.env.NODE_ENV !== 'development';

function modCookieOpts(maxAgeMs?: number): import('express').CookieOptions {
  return {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: 'lax',
    path:     '/',
    ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {}),
  };
}

// Login: verifica credenciais na tabela moderators e retorna JWT próprio
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password, rememberMe } = req.body as { email?: string; password?: string; rememberMe?: boolean };
  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    return;
  }

  try {
    const { data: mod, error } = await supabase
      .from('moderators')
      .select('id, login, email, role, password_hash, email_verified_at')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !mod) {
      res.status(401).json({ error: 'Email ou senha incorretos.' });
      return;
    }

    const modRow = mod as {
      id: string; login: string; email: string;
      role: ModeratorRole; password_hash: string; email_verified_at: string | null;
    };

    if (!modRow.email_verified_at) {
      res.status(401).json({ error: 'Conta não verificada. Conclua o cadastro via link de convite.' });
      return;
    }

    const valid = await bcrypt.compare(password, modRow.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Email ou senha incorretos.' });
      return;
    }

    const persist   = rememberMe === true;
    const expiresIn = persist ? '30d' : '8h';
    const maxAge    = persist ? MOD_COOKIE_30D_MS : undefined;

    const token = jwt.sign(
      { sub: modRow.id, role: modRow.role },
      config.jwtSecret,
      { expiresIn },
    );

    res.cookie(MOD_COOKIE_NAME, token, modCookieOpts(maxAge));
    res.json({
      session: { access_token: token },
      user:    { id: modRow.id, login: modRow.login, email: modRow.email },
      role:    modRow.role,
    });
  } catch (err) {
    console.error('[POST /auth/login] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// GET /auth/mod/me — restaura sessão de moderador a partir do cookie HttpOnly
router.get('/mod/me', async (req: Request, res: Response): Promise<void> => {
  const token = (req.cookies as Record<string, string> | undefined)?.[MOD_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  let payload: { sub: string; role: ModeratorRole };
  try {
    payload = jwt.verify(token, config.jwtSecret) as { sub: string; role: ModeratorRole };
  } catch {
    res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    return;
  }

  try {
    const { data: mod } = await supabase
      .from('moderators')
      .select('id, login, email, role')
      .eq('id', payload.sub)
      .maybeSingle();

    if (!mod) {
      res.status(401).json({ error: 'Conta não encontrada.' });
      return;
    }

    const modRow = mod as { id: string; login: string; email: string; role: ModeratorRole };
    res.json({
      session: { access_token: token },
      user:    { id: modRow.id, login: modRow.login, email: modRow.email },
      role:    modRow.role,
    });
  } catch (err) {
    console.error('[GET /auth/mod/me] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie(MOD_COOKIE_NAME, modCookieOpts());
  res.status(204).send();
});

router.post('/signup', async (_req: Request, res: Response): Promise<void> => {
  res.status(403).json({ error: 'Cadastro direto não permitido. Use o convite enviado pelo painel de moderadores.' });
});

// POST /auth/mod/forgot-password — solicita link de redefinição de senha para moderador
router.post('/mod/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) {
    res.status(400).json({ error: 'Email é obrigatório.' });
    return;
  }

  try {
    const { data: mod } = await supabase
      .from('moderators')
      .select('id, login, email, email_verified_at')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    // Resposta genérica independente de o email existir (evita enumeração)
    if (!mod || !mod.email_verified_at) {
      res.json({ message: 'Se o email estiver cadastrado, você receberá um link em instantes.' });
      return;
    }

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

    await supabase
      .from('moderators')
      .update({ reset_token: token, reset_token_expires_at: expires })
      .eq('id', mod.id);

    await sendModPasswordResetEmail(mod.email as string, mod.login as string, token);

    res.json({ message: 'Se o email estiver cadastrado, você receberá um link em instantes.' });
  } catch (err) {
    console.error('[POST /auth/mod/forgot-password]', err);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

// POST /auth/mod/reset-password — redefine senha via token do email
router.post('/mod/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token?.trim() || !password) {
    res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    return;
  }

  const pwdError = validatePassword(password);
  if (pwdError) { res.status(400).json({ error: pwdError }); return; }

  try {
    const { data: mod } = await supabase
      .from('moderators')
      .select('id, reset_token, reset_token_expires_at')
      .eq('reset_token', token.trim())
      .maybeSingle();

    if (!mod) {
      res.status(400).json({ error: 'Link inválido ou já utilizado.' });
      return;
    }

    if (!mod.reset_token_expires_at || new Date(mod.reset_token_expires_at as string) < new Date()) {
      res.status(400).json({ error: 'Link expirado. Solicite um novo.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    await supabase
      .from('moderators')
      .update({ password_hash, reset_token: null, reset_token_expires_at: null })
      .eq('id', mod.id);

    res.json({ message: 'Senha redefinida com sucesso. Faça login com a nova senha.' });
  } catch (err) {
    console.error('[POST /auth/mod/reset-password]', err);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

export default router;

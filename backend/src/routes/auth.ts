import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabase';
import { translateSupabaseError } from '../lib/errors';
import { config } from '../config';
import type { ModeratorRole } from '../types';

const router = Router();

// Login: verifica credenciais na tabela moderators e retorna JWT próprio
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
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

    const token = jwt.sign(
      { sub: modRow.id, role: modRow.role },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

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

router.post('/logout', (_req: Request, res: Response): void => {
  res.status(204).send();
});

router.post('/signup', async (_req: Request, res: Response): Promise<void> => {
  res.status(403).json({ error: 'Cadastro direto não permitido. Use o convite enviado pelo painel de moderadores.' });
});

export { translateSupabaseError };
export default router;

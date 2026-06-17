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
  const { login, password } = req.body as { login?: string; password?: string };
  if (!login || !password) {
    res.status(400).json({ error: 'Login e senha são obrigatórios.' });
    return;
  }

  try {
    const { data: mod, error } = await supabase
      .from('moderators')
      .select('id, login, role, password_hash')
      .eq('login', login.trim().toLowerCase())
      .single();

    if (error || !mod) {
      res.status(401).json({ error: 'Login ou senha incorretos.' });
      return;
    }

    const modRow = mod as { id: string; login: string; role: ModeratorRole; password_hash: string };

    const valid = await bcrypt.compare(password, modRow.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Login ou senha incorretos.' });
      return;
    }

    const token = jwt.sign(
      { sub: modRow.id, role: modRow.role },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    res.json({
      session: { access_token: token },
      user:    { login: modRow.login },
      role:    modRow.role,
    });
  } catch (err) {
    console.error('[POST /auth/login] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

router.post('/logout', (_req: Request, res: Response): void => {
  // JWT é stateless — basta o cliente descartar o token
  res.status(204).send();
});

// Mantido para compatibilidade caso necessário no futuro
router.post('/signup', async (_req: Request, res: Response): Promise<void> => {
  res.status(403).json({ error: 'Cadastro direto não permitido. Use o painel de moderadores.' });
});

export { translateSupabaseError };
export default router;

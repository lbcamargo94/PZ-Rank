import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../supabase';
import { dbError, translateSupabaseError } from '../lib/errors';
import { requireMaster } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';

const router = Router();

// GET /moderators — master
router.get('/', requireMaster, async (_req: ModRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('moderators')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[GET /moderators] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar moderadores.' });
  }
});

// POST /moderators — master: cria novo moderador com senha hasheada
router.post('/', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('moderators')
      .insert([{ email: email.trim().toLowerCase(), role: 'moderator', password_hash }])
      .select('id, email, role, created_at')
      .single();

    if (error) {
      const msg = error.code === '23505'
        ? 'Este e-mail já está cadastrado como moderador.'
        : translateSupabaseError(error.message);
      res.status(error.code === '23505' ? 400 : 500).json({ error: msg });
      return;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('[POST /moderators] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao criar moderador.' });
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

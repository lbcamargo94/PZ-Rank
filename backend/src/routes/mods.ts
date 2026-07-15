import { Router } from 'express';
import type { Response } from 'express';
import { supabase } from '../supabase';
import { dbError, translateSupabaseError } from '../lib/errors';
import { requireModerator } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';

const router = Router();

// GET /mods — public: returns only active mods
router.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('mods')
      .select('id, name, workshop_url, created_at')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[GET /mods] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar mods.' });
  }
});

// GET /mods/all — moderator: returns all mods (active + blocked)
router.get('/all', requireModerator, async (_req: ModRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('mods')
      .select('id, name, workshop_url, status, created_at')
      .order('name', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[GET /mods/all] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar mods.' });
  }
});

// POST /mods — moderator: add new mod
router.post('/', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const { name, workshop_url } = req.body as { name?: string; workshop_url?: string };

  if (!name?.trim() || !workshop_url?.trim()) {
    res.status(400).json({ error: 'Nome e URL da oficina são obrigatórios.' });
    return;
  }

  const trimmedUrl = workshop_url.trim();
  if (!trimmedUrl.startsWith('https://steamcommunity.com/')) {
    res.status(400).json({ error: 'A URL deve ser da Steam (steamcommunity.com).' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('mods')
      .insert([{ name: name.trim(), workshop_url: trimmedUrl }])
      .select('id, name, workshop_url, status, created_at')
      .single();

    if (error) {
      const msg = error.code === '23505'
        ? 'Este mod já está cadastrado.'
        : translateSupabaseError(error.message);
      res.status(error.code === '23505' ? 400 : 500).json({ error: msg });
      return;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('[POST /mods] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao adicionar mod.' });
  }
});

// PATCH /mods/:id/block — moderator
router.patch('/:id/block', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  try {
    const { data, error } = await supabase
      .from('mods')
      .update({ status: 'blocked' })
      .eq('id', id)
      .select('id, name, workshop_url, status, created_at')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    if (!data) { res.status(404).json({ error: 'Mod não encontrado.' }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /mods/:id/block] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao bloquear mod.' });
  }
});

// PATCH /mods/:id/unblock — moderator
router.patch('/:id/unblock', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  try {
    const { data, error } = await supabase
      .from('mods')
      .update({ status: 'active' })
      .eq('id', id)
      .select('id, name, workshop_url, status, created_at')
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    if (!data) { res.status(404).json({ error: 'Mod não encontrado.' }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /mods/:id/unblock] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao desbloquear mod.' });
  }
});

// DELETE /mods/:id — moderator: remove permanently
router.delete('/:id', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  try {
    const { error } = await supabase.from('mods').delete().eq('id', id);
    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /mods/:id] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao remover mod.' });
  }
});

export default router;

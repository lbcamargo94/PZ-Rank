import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requireMaster } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';

const router = Router();

type FinanceCategory = 'hosting' | 'prize' | 'domain' | 'adsense' | 'supporters' | 'sponsor' | 'other';
const VALID_CATEGORIES: FinanceCategory[] = ['hosting', 'prize', 'domain', 'adsense', 'supporters', 'sponsor', 'other'];

// GET /finances/current — público: finanças da temporada ativa
router.get('/current', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: season, error: se } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    if (se) { const e = dbError(se); res.status(e.httpStatus).json({ error: e.message }); return; }
    if (!season) { res.json([]); return; }

    const { data, error } = await supabase
      .from('season_finances')
      .select('*')
      .eq('season_id', (season as { id: number }).id)
      .order('category', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data ?? []);
  } catch (err) {
    console.error('[GET /finances/current]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /finances/season/:id — público
router.get('/season/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('season_finances')
      .select('*')
      .eq('season_id', id)
      .order('category', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data ?? []);
  } catch (err) {
    console.error('[GET /finances/season/:id]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /finances — master: criar entrada
router.post('/', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const { season_id, category, label, amount_brl, goal_brl } = req.body as {
    season_id?:  number;
    category?:   string;
    label?:      string;
    amount_brl?: number;
    goal_brl?:   number | null;
  };

  if (!season_id || isNaN(Number(season_id))) {
    res.status(400).json({ error: 'season_id inválido.' }); return;
  }
  if (!category || !VALID_CATEGORIES.includes(category as FinanceCategory)) {
    res.status(400).json({ error: 'Categoria inválida.' }); return;
  }
  if (!label?.trim()) {
    res.status(400).json({ error: 'Label é obrigatório.' }); return;
  }
  if (typeof amount_brl !== 'number') {
    res.status(400).json({ error: 'amount_brl deve ser um número.' }); return;
  }

  try {
    const { data, error } = await supabase
      .from('season_finances')
      .insert([{
        season_id: Number(season_id),
        category,
        label: label.trim(),
        amount_brl,
        goal_brl: goal_brl ?? null,
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.status(201).json(data);
  } catch (err) {
    console.error('[POST /finances]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PATCH /finances/:id — master: atualizar entrada
router.patch('/:id', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { category, label, amount_brl, goal_brl } = req.body as {
    category?:   string;
    label?:      string;
    amount_brl?: number;
    goal_brl?:   number | null;
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (category !== undefined) {
    if (!VALID_CATEGORIES.includes(category as FinanceCategory)) {
      res.status(400).json({ error: 'Categoria inválida.' }); return;
    }
    patch.category = category;
  }
  if (label !== undefined) {
    if (!label.trim()) { res.status(400).json({ error: 'Label não pode ser vazio.' }); return; }
    patch.label = label.trim();
  }
  if (amount_brl !== undefined) {
    if (typeof amount_brl !== 'number') { res.status(400).json({ error: 'amount_brl deve ser um número.' }); return; }
    patch.amount_brl = amount_brl;
  }
  if ('goal_brl' in req.body) patch.goal_brl = goal_brl ?? null;

  try {
    const { data, error } = await supabase
      .from('season_finances')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /finances/:id]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /finances/:id — master
router.delete('/:id', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { error } = await supabase
      .from('season_finances')
      .delete()
      .eq('id', id);

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /finances/:id]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;

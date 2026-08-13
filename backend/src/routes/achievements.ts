import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requireModerator, requireMaster } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';

const router = Router();

// GET /achievements — lista todas as conquistas (pública)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('id, slug, name, description, icon, tier, stat, threshold')
    .order('stat', { ascending: true })
    .order('threshold', { ascending: true });

  if (error) { res.status(500).json({ error: dbError(error).message }); return; }
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');
  res.json({ achievements: data ?? [] });
});

// GET /achievements/player/:id — conquistas desbloqueadas por um jogador (pública)
router.get('/player/:id', async (req: Request, res: Response): Promise<void> => {
  const playerId = parseInt(req.params['id'] as string, 10);
  if (isNaN(playerId)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const [{ data: unlocked, error: e1 }, { data: defs, error: e2 }] = await Promise.all([
    supabase
      .from('player_achievements')
      .select('achievement_id, unlocked_at, entry_id')
      .eq('player_id', playerId),
    supabase
      .from('achievements')
      .select('id, slug, name, description, icon, tier, stat, threshold'),
  ]);

  if (e1 || e2) {
    res.status(500).json({ error: dbError((e1 ?? e2)!).message });
    return;
  }

  const defMap = Object.fromEntries(
    (defs ?? []).map((d: { id: number }) => [d.id, d]),
  );

  const result = (unlocked ?? []).map((u: { achievement_id: number; unlocked_at: string; entry_id: number | null }) => ({
    ...defMap[u.achievement_id],
    unlocked_at: u.unlocked_at,
    entry_id:    u.entry_id ?? null,
  }));

  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
  res.json({ achievements: result });
});

// POST /achievements/player/:playerId/:slug — conceder conquista manualmente (moderador)
router.post('/player/:playerId/:slug', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const playerId = parseInt(req.params['playerId'] as string, 10);
  const slug = String(req.params['slug'] ?? '').trim();

  if (isNaN(playerId) || !slug) { res.status(400).json({ error: 'Parâmetros inválidos.' }); return; }

  const { data: ach, error: achErr } = await supabase
    .from('achievements')
    .select('id, slug, name, description, icon, tier, stat, threshold')
    .eq('slug', slug)
    .maybeSingle();

  if (achErr) { res.status(500).json({ error: dbError(achErr).message }); return; }
  if (!ach)   { res.status(404).json({ error: 'Conquista não encontrada.' }); return; }

  const { data: existing } = await supabase
    .from('player_achievements')
    .select('achievement_id')
    .eq('player_id', playerId)
    .eq('achievement_id', (ach as { id: number }).id)
    .maybeSingle();

  if (existing) { res.status(409).json({ error: 'Conquista já desbloqueada para este jogador.' }); return; }

  const now = new Date().toISOString();
  const { error: insErr } = await supabase
    .from('player_achievements')
    .insert({ player_id: playerId, achievement_id: (ach as { id: number }).id, entry_id: null, unlocked_at: now });

  if (insErr) { res.status(500).json({ error: dbError(insErr).message }); return; }

  res.status(201).json({ achievement: { ...ach, unlocked_at: now, entry_id: null } });
});

// DELETE /achievements/player/:playerId/:slug — revogar conquista (master)
router.delete('/player/:playerId/:slug', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const playerId = parseInt(req.params['playerId'] as string, 10);
  const slug = String(req.params['slug'] ?? '').trim();

  if (isNaN(playerId) || !slug) { res.status(400).json({ error: 'Parâmetros inválidos.' }); return; }

  const { data: ach, error: achErr } = await supabase
    .from('achievements')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (achErr) { res.status(500).json({ error: dbError(achErr).message }); return; }
  if (!ach)   { res.status(404).json({ error: 'Conquista não encontrada.' }); return; }

  const { error: delErr } = await supabase
    .from('player_achievements')
    .delete()
    .eq('player_id', playerId)
    .eq('achievement_id', (ach as { id: number }).id);

  if (delErr) { res.status(500).json({ error: dbError(delErr).message }); return; }

  res.status(204).send();
});

export default router;

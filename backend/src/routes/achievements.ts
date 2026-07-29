import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';

const router = Router();

// GET /achievements — lista todas as conquistas (pública)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('id, slug, name, description, icon, tier, stat, threshold')
    .order('stat', { ascending: true })
    .order('threshold', { ascending: true });

  if (error) { res.status(500).json({ error: dbError(error).message }); return; }
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
      .select('id, slug, name, description, icon, tier'),
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

  res.json({ achievements: result });
});

export default router;

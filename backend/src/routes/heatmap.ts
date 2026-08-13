import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';

const router = Router();

// GET /heatmap/current — pontos da temporada ativa (público)
router.get('/current', async (_req: Request, res: Response): Promise<void> => {
  const { data: season } = await supabase
    .from('seasons')
    .select('id, name')
    .eq('is_active', true)
    .maybeSingle();

  if (!season) {
    res.json({ points: [], season: null });
    return;
  }

  const { data, error } = await supabase
    .from('heatmap_events')
    .select('event_type, grid_x, grid_y, count')
    .eq('season_id', (season as { id: number }).id);

  if (error) { res.status(500).json({ error: dbError(error).message }); return; }

  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=120');
  res.json({
    points:  data ?? [],
    season:  season,
  });
});

export default router;

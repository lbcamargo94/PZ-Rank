import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';

const router = Router();

// GET /stats/global — totais da temporada (somente entries aprovadas e válidas)
router.get('/global', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('entries')
    .select('kills, days, is_alive, sandbox_ok, deleted_at')
    .is('deleted_at', null)
    .neq('sandbox_ok', false);

  if (error) { const e = dbError(error); return res.status(e.httpStatus).json({ error: e.message }); }

  let total_kills    = 0;
  let total_days     = 0;
  let alive_count    = 0;
  let dead_count     = 0;
  let player_count   = 0;

  for (const e of (data ?? [])) {
    total_kills  += e.kills  ?? 0;
    total_days   += e.days   ?? 0;
    player_count += 1;
    if (e.is_alive) alive_count++;
    else            dead_count++;
  }

  res.json({ total_kills, total_days, alive_count, dead_count, player_count });
});

export default router;

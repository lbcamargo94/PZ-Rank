import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';

const router = Router();

// GET /stats/global — totais da temporada (somente entries aprovadas e válidas)
router.get('/global', async (_req: Request, res: Response) => {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [mainRes, activeRes] = await Promise.all([
    supabase
      .from('entries')
      .select('kills, days, is_alive, sandbox_ok, deleted_at')
      .is('deleted_at', null)
      .neq('sandbox_ok', false),
    supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .neq('sandbox_ok', false)
      .gte('updated_at', since24h),
  ]);

  if (mainRes.error)   { const e = dbError(mainRes.error);   return res.status(e.httpStatus).json({ error: e.message }); }
  if (activeRes.error) { const e = dbError(activeRes.error); return res.status(e.httpStatus).json({ error: e.message }); }

  let total_kills    = 0;
  let total_days     = 0;
  let alive_count    = 0;
  let dead_count     = 0;
  let player_count   = 0;

  for (const e of (mainRes.data ?? [])) {
    total_kills  += e.kills  ?? 0;
    total_days   += e.days   ?? 0;
    player_count += 1;
    if (e.is_alive) alive_count++;
    else            dead_count++;
  }

  const active_count = activeRes.count ?? 0;

  res.json({ total_kills, total_days, alive_count, dead_count, player_count, active_count });
});

// GET /stats/legends — recordes all-time
router.get('/legends', async (_req: Request, res: Response) => {
  const entrySelect = 'name, character_name, player_id, kills, days, score';

  const [killsRes, daysRes, scoreRes, hofRes] = await Promise.all([
    supabase.from('entries').select(entrySelect)
      .is('deleted_at', null).neq('sandbox_ok', false)
      .order('kills', { ascending: false }).limit(1).maybeSingle(),

    supabase.from('entries').select(entrySelect)
      .is('deleted_at', null).neq('sandbox_ok', false)
      .order('days', { ascending: false }).limit(1).maybeSingle(),

    supabase.from('entries').select(entrySelect)
      .is('deleted_at', null).neq('sandbox_ok', false)
      .order('score', { ascending: false }).limit(1).maybeSingle(),

    supabase.from('hall_of_fame')
      .select('entry_name, character_name, player_id, kills, days, score, season_id')
      .eq('position', 1)
      .order('season_id', { ascending: true }).limit(1).maybeSingle(),
  ]);

  const firstErr = [killsRes.error, daysRes.error, scoreRes.error, hofRes.error].find(Boolean);
  if (firstErr) { const e = dbError(firstErr); return res.status(e.httpStatus).json({ error: e.message }); }

  let firstChampion: Record<string, unknown> | null = null;
  if (hofRes.data) {
    const { data: season } = await supabase
      .from('seasons').select('name').eq('id', (hofRes.data as Record<string, unknown>).season_id).maybeSingle();
    firstChampion = { ...(hofRes.data as Record<string, unknown>), season_name: (season as Record<string, unknown> | null)?.name ?? null };
  }

  res.json({
    most_kills:     killsRes.data,
    most_days:      daysRes.data,
    highest_score:  scoreRes.data,
    first_champion: firstChampion,
  });
});

export default router;

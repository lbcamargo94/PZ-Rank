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

  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
  res.json({ total_kills, total_days, alive_count, dead_count, player_count, active_count });
});

// GET /stats/steam-players — jogadores simultâneos no PZ via Steam Web API (cache 5min)
const PZ_APP_ID = 108600;
let _steamCache: { count: number; at: number } | null = null;

router.get('/steam-players', async (_req: Request, res: Response) => {
  if (_steamCache && Date.now() - _steamCache.at < 5 * 60 * 1000) {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.json({ player_count: _steamCache.count });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const r = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${PZ_APP_ID}`,
      { signal: controller.signal },
    );
    const json = await r.json() as { response: { player_count: number; result: number } };
    if (json.response.result !== 1) throw new Error('Steam API error');
    _steamCache = { count: json.response.player_count, at: Date.now() };
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.json({ player_count: json.response.player_count });
  } catch {
    if (_steamCache) {
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
      return res.json({ player_count: _steamCache.count });
    }
    res.status(503).json({ error: 'Steam API indisponível' });
  } finally {
    clearTimeout(timer);
  }
});

// GET /stats/legends — recordes da temporada + hall da fama
router.get('/legends', async (_req: Request, res: Response) => {
  const entrySelect = 'name, character_name, player_id, kills, days, score';
  const ef          = (q: ReturnType<typeof supabase.from>) =>
    (q as ReturnType<typeof supabase.from> & { is: Function; neq: Function })
      .is('deleted_at', null).neq('sandbox_ok', false);

  const [killsRes, daysRes, scoreRes, leaderRes, richRes, hofFirstRes, hofAllRes, seasonsRes] = await Promise.all([
    ef(supabase.from('entries').select(entrySelect))
      .order('kills', { ascending: false }).limit(1).maybeSingle(),

    ef(supabase.from('entries').select(entrySelect))
      .order('days', { ascending: false }).limit(1).maybeSingle(),

    ef(supabase.from('entries').select(entrySelect))
      .order('score', { ascending: false }).limit(1).maybeSingle(),

    ef(supabase.from('entries').select(entrySelect).eq('is_alive', true))
      .order('score', { ascending: false }).limit(1).maybeSingle(),

    ef(supabase.from('entries').select(`${entrySelect}, skills, objectives, updated_at`)),

    supabase.from('hall_of_fame')
      .select('entry_name, character_name, player_id, kills, days, score, season_id')
      .eq('position', 1).order('season_id', { ascending: true }).limit(1).maybeSingle(),

    supabase.from('hall_of_fame')
      .select('entry_name, character_name, player_id, kills, days, score, season_id, position')
      .order('season_id', { ascending: false }).order('position', { ascending: true }),

    supabase.from('seasons').select('id, name').order('id', { ascending: false }),
  ]);

  const firstErr = [killsRes.error, daysRes.error, scoreRes.error, leaderRes.error,
                    richRes.error, hofFirstRes.error, hofAllRes.error, seasonsRes.error].find(Boolean);
  if (firstErr) { const e = dbError(firstErr); return res.status(e.httpStatus).json({ error: e.message }); }

  type RichRow = {
    name: string; character_name: string | null; player_id: number | null;
    kills: number; days: number; score: number;
    skills: string | null; objectives: Record<string, unknown> | null; updated_at: string;
  };
  const { countSkills10 } = await import('../lib/scoring');
  const richRows = (richRes.data ?? []) as RichRow[];

  // Mais habilidades no nível 10
  let mostSkills10: (Omit<RichRow, 'skills'|'objectives'|'updated_at'> & { skills10_count: number }) | null = null;
  for (const row of richRows) {
    const count = countSkills10(row.skills);
    if (count > 0 && (!mostSkills10 || count > mostSkills10.skills10_count)) {
      const { skills: _s, objectives: _o, updated_at: _u, ...base } = row;
      mostSkills10 = { ...base, skills10_count: count };
    }
  }

  // Mais bases Spiffo concluídas
  let mostSpiffo: (Omit<RichRow, 'skills'|'objectives'|'updated_at'> & { spiffo_count: number }) | null = null;
  for (const row of richRows) {
    if (!row.objectives) continue;
    const bases = (row.objectives['bases'] ?? {}) as Record<string, Record<string, unknown>>;
    const count = Object.values(bases).filter(b => b['has_base'] === true).length;
    if (count > 0 && (!mostSpiffo || count > mostSpiffo.spiffo_count)) {
      const { skills: _s, objectives: _o, updated_at: _u, ...base } = row;
      mostSpiffo = { ...base, spiffo_count: count };
    }
  }

  // Primeiro a conquistar a base militar (proxy: updated_at mais antigo com military_base=true)
  const militaryRows = richRows
    .filter(r => r.objectives?.['military_base'] === true)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  const militaryHolder = militaryRows[0]
    ? (({ skills: _s, objectives: _o, updated_at: _u, ...base }) => base)(militaryRows[0])
    : null;

  // Hall da Fama — agrupa por temporada
  type HofRow = { entry_name: string; character_name: string | null; player_id: number | null; kills: number; days: number; score: number; season_id: number; position: number };
  const seasons    = (seasonsRes.data ?? []) as Array<{ id: number; name: string }>;
  const seasonMap  = new Map(seasons.map(s => [s.id, s.name]));
  const hofRows    = (hofAllRes.data ?? []) as HofRow[];
  const hofMap     = new Map<number, HofRow[]>();
  for (const row of hofRows) {
    if (!hofMap.has(row.season_id)) hofMap.set(row.season_id, []);
    hofMap.get(row.season_id)!.push(row);
  }
  const hallOfFame = [...hofMap.entries()].map(([sid, podium]) => ({
    season_id:   sid,
    season_name: seasonMap.get(sid) ?? null,
    podium,
  }));

  // Primeiro campeão (posição 1 da temporada mais antiga do HoF)
  let firstChampion: Record<string, unknown> | null = null;
  if (hofFirstRes.data) {
    const sid = (hofFirstRes.data as Record<string, unknown>)['season_id'] as number;
    firstChampion = { ...(hofFirstRes.data as Record<string, unknown>), season_name: seasonMap.get(sid) ?? null };
  }

  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=120');
  res.json({
    current_leader:       leaderRes.data,
    most_kills:           killsRes.data,
    most_days:            daysRes.data,
    highest_score:        scoreRes.data,
    most_skills_10:       mostSkills10,
    most_spiffo_bases:    mostSpiffo,
    military_base_holder: militaryHolder,
    first_champion:       firstChampion,
    hall_of_fame:         hallOfFame,
  });
});

export default router;

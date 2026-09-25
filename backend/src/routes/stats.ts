import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { normalizeProfession } from '../lib/professions';
import {
  applyFilters, computeChampionshipStats, computeRanking, isRankingMetric,
  type StatsFilters,
} from '../lib/statistics';
import { loadStatsRows, officialOverview } from '../lib/statsData';

const router = Router();

// GET /stats/global — totais do campeonato no topo da home.
// Mesma fonte e mesmas regras de /estatisticas (lib/statsData.ts): inclui runs
// anteriores (run_history) e ignora partidas encerradas com 0 dias e 0 kills.
// Os dois contadores divergiam antes disso (decisão do usuário: manter alinhados).
router.get('/global', async (_req: Request, res: Response) => {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const [overview, activeRes] = await Promise.all([
      officialOverview(),
      // "Jogando hoje": só runs atuais sincronizadas nas últimas 24h — não depende do histórico
      supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('sandbox_ok', true)
        .eq('is_alive', true)
        .gte('updated_at', since24h),
    ]);
    if (activeRes.error) { const e = dbError(activeRes.error); return res.status(e.httpStatus).json({ error: e.message }); }

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
    res.json({
      total_kills:  overview.total_kills,
      total_days:   overview.total_days,
      alive_count:  overview.alive,            // vivos ATIVOS (sync nos últimos 14 dias)
      inactive_count: overview.alive_inactive, // vivos sem sync há 14+ dias
      dead_count:   overview.dead,
      player_count: overview.runs,
      active_count: activeRes.count ?? 0,
    });
  } catch (error) {
    const e = dbError(error as Parameters<typeof dbError>[0]);
    res.status(e.httpStatus).json({ error: e.message });
  }
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

// Maior valor entre a run atual (entries) e as anteriores (run_history).
// Empate fica com a run atual. `previous_run` deixa o frontend sinalizar.
function pickRecord(
  current:  Record<string, unknown> | null,
  previous: Record<string, unknown> | null,
  field:    'kills' | 'days',
): Record<string, unknown> | null {
  if (!previous) return current;
  if (!current || Number(previous[field]) > Number(current[field])) return { ...previous, previous_run: true };
  return current;
}

// GET /stats/legends — recordes da temporada + hall da fama
router.get('/legends', async (_req: Request, res: Response) => {
  // created_at incluído para tiebreak: quem alcançou o marco PRIMEIRO mantém o posto
  const entrySelect = 'name, character_name, player_id, kills, days, score, created_at';
  const ef          = (q: ReturnType<typeof supabase.from>) =>
    (q as ReturnType<typeof supabase.from> & { is: Function; neq: Function })
      .is('deleted_at', null).neq('sandbox_ok', false);

  // Runs anteriores (run_history) também valem pra "mais kills" e "maior
  // sobrevivência" — senão uma run recordista some quando o jogador começa uma
  // partida nova com o mesmo nome (caso Kdevil, 563 dias).
  const histSelect = 'name, character_name, player_id, kills, days, score, created_at';
  const [histKillsRes, histDaysRes] = await Promise.all([
    supabase.from('run_history').select(histSelect).neq('sandbox_ok', false)
      .order('kills', { ascending: false }).order('created_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('run_history').select(histSelect).neq('sandbox_ok', false)
      .order('days', { ascending: false }).order('created_at', { ascending: true }).limit(1).maybeSingle(),
  ]);

  const [
    killsRes, daysRes, scoreRes, leaderRes,
    richRes,
    hofFirstRes, hofAllRes, seasonsRes,
  ] = await Promise.all([
    ef(supabase.from('entries').select(entrySelect))
      .order('kills', { ascending: false }).order('created_at', { ascending: true })
      .limit(1).maybeSingle(),

    ef(supabase.from('entries').select(entrySelect))
      .order('days', { ascending: false }).order('created_at', { ascending: true })
      .limit(1).maybeSingle(),

    ef(supabase.from('entries').select(entrySelect))
      .order('score', { ascending: false }).order('created_at', { ascending: true })
      .limit(1).maybeSingle(),

    ef(supabase.from('entries').select(entrySelect).eq('is_alive', true))
      .order('score', { ascending: false }).order('created_at', { ascending: true })
      .limit(1).maybeSingle(),

    // richRes ordenado por created_at para tiebreak em skills10 / spiffo / base militar
    ef(supabase.from('entries').select(`${entrySelect}, skills, objectives`))
      .order('created_at', { ascending: true }),

    supabase.from('hall_of_fame')
      .select('entry_name, character_name, player_id, kills, days, score, season_id')
      .eq('position', 1).order('season_id', { ascending: true }).limit(1).maybeSingle(),

    supabase.from('hall_of_fame')
      .select('entry_name, character_name, player_id, kills, days, score, season_id, position')
      .order('season_id', { ascending: false }).order('position', { ascending: true }),

    supabase.from('seasons').select('id, name').order('id', { ascending: false }),
  ]);

  const firstErr = [
    killsRes.error, daysRes.error, scoreRes.error, leaderRes.error,
    richRes.error, hofFirstRes.error, hofAllRes.error, seasonsRes.error,
  ].find(Boolean);
  if (firstErr) { const e = dbError(firstErr); return res.status(e.httpStatus).json({ error: e.message }); }

  type RichRow = {
    name: string; character_name: string | null; player_id: number | null;
    kills: number; days: number; score: number; created_at: string;
    skills: string | null; objectives: Record<string, unknown> | null;
  };
  const { countSkills10 } = await import('../lib/scoring');
  // richRows já vem ordenado por created_at ASC — o primeiro com o max é o detentor do marco
  const richRows = (richRes.data ?? []) as RichRow[];

  // Mais habilidades no nível 10
  let mostSkills10: (Omit<RichRow, 'skills'|'objectives'> & { skills10_count: number }) | null = null;
  for (const row of richRows) {
    const count = countSkills10(row.skills);
    if (count > 0 && (!mostSkills10 || count > mostSkills10.skills10_count)) {
      const { skills: _s, objectives: _o, ...base } = row;
      mostSkills10 = { ...base, skills10_count: count };
    }
  }

  // Mais bases Spiffo concluídas
  let mostSpiffo: (Omit<RichRow, 'skills'|'objectives'> & { spiffo_count: number }) | null = null;
  for (const row of richRows) {
    if (!row.objectives) continue;
    const bases = (row.objectives['bases'] ?? {}) as Record<string, Record<string, unknown>>;
    const count = Object.values(bases).filter(b => b['has_base'] === true).length;
    if (count > 0 && (!mostSpiffo || count > mostSpiffo.spiffo_count)) {
      const { skills: _s, objectives: _o, ...base } = row;
      mostSpiffo = { ...base, spiffo_count: count };
    }
  }

  // Primeiro a conquistar a base militar — richRows já ordenado por created_at
  const militaryRows = richRows.filter(r => r.objectives?.['military_base'] === true);
  const militaryHolder = militaryRows[0]
    ? (({ skills: _s, objectives: _o, ...base }) => base)(militaryRows[0])
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
    most_kills:           pickRecord(killsRes.data, histKillsRes.data, 'kills'),
    most_days:            pickRecord(daysRes.data, histDaysRes.data, 'days'),
    highest_score:        scoreRes.data,
    most_skills_10:       mostSkills10,
    most_spiffo_bases:    mostSpiffo,
    military_base_holder: militaryHolder,
    first_champion:       firstChampion,
    hall_of_fame:         hallOfFame,
  });
});

// ── Estatísticas do campeonato (/estatisticas) ─────────────────────────────
// Agregação em lib/statistics.ts; leitura + regras oficiais em lib/statsData.ts
// (mesma fonte do contador da home e do Jornal diário). Aqui: filtros da URL e
// cache do resultado por combinação de filtros.
//
// Temporada: só `season=current` — entries.season_id só passou a ser gravado na
// v4.23.0; as runs anteriores não têm temporada (ver docs/estatisticas.md).

let _statsResultCache: { at: number; results: Map<string, object> } = { at: 0, results: new Map() };

/** season: 'current' (padrão = temporada ativa) | 'all' | id numérico. */
function parseStatsFilters(q: Request['query'], activeSeasonId: number | null): StatsFilters | string {
  const status = typeof q.status === 'string' && q.status ? q.status : 'all';
  if (status !== 'all' && status !== 'alive' && status !== 'inactive' && status !== 'dead') return 'status inválido.';
  const season = typeof q.season === 'string' && q.season ? q.season : 'current';
  let seasonId: number | null;
  if (season === 'current') seasonId = activeSeasonId;
  else if (season === 'all') seasonId = null;
  else if (/^\d{1,9}$/.test(season)) seasonId = Number(season);
  else return 'temporada inválida.';
  const profession = typeof q.profession === 'string' && q.profession.trim()
    ? normalizeProfession(q.profession.slice(0, 80)) : null;
  return { status, profession, includeDisqualified: q.include_dq === '1' || q.include_dq === 'true', seasonId };
}

// GET /stats/championship?status=all|alive|inactive|dead&profession=&include_dq=0|1&season=current|all|<id>
router.get('/championship', async (req: Request, res: Response) => {
  try {
    const cache = await loadStatsRows();
    const filters = parseStatsFilters(req.query, cache.season?.id ?? null);
    if (typeof filters === 'string') return res.status(400).json({ error: filters });
    // Resultado memoizado por combinação de filtros enquanto as linhas em cache
    // forem as mesmas (~50ms de agregação com ~550 runs — evita repetir a cada acesso)
    const key = JSON.stringify(filters);
    if (_statsResultCache.at !== cache.at) _statsResultCache = { at: cache.at, results: new Map() };
    let body = _statsResultCache.results.get(key);
    if (!body) {
      body = {
        season:       cache.season,
        filters,
        generated_at: new Date(cache.at).toISOString(),
        ...computeChampionshipStats(cache.rows, filters),
      };
      // Teto contra query string arbitrária em `profession` inflando o Map
      if (_statsResultCache.results.size >= 200) _statsResultCache.results.clear();
      _statsResultCache.results.set(key, body);
    }
    res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=120');
    res.json(body);
  } catch (error) {
    const e = dbError(error as Parameters<typeof dbError>[0]);
    res.status(e.httpStatus).json({ error: e.message });
  }
});

// GET /stats/championship/ranking?metric=kills|days|score|skills10|skill_levels|bases|skill:<Nome>|action:<chave>&limit=50 (+ filtros)
router.get('/championship/ranking', async (req: Request, res: Response) => {
  const metric = typeof req.query.metric === 'string' ? req.query.metric.slice(0, 60) : '';
  if (!isRankingMetric(metric)) return res.status(400).json({ error: 'metric inválida.' });
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));

  try {
    const { rows, season } = await loadStatsRows();
    const filters = parseStatsFilters(req.query, season?.id ?? null);
    if (typeof filters === 'string') return res.status(400).json({ error: filters });
    res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=120');
    res.json({ metric, ranking: computeRanking(applyFilters(rows, filters), metric, limit) });
  } catch (error) {
    const e = dbError(error as Parameters<typeof dbError>[0]);
    res.status(e.httpStatus).json({ error: e.message });
  }
});

export default router;

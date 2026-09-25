// Leitura única das runs usadas por TODOS os números públicos do campeonato:
// /estatisticas, o contador da home (GET /stats/global) e o Jornal diário (news).
// Antes cada um lia `entries` do seu jeito e os números divergiam.
//
// Regras oficiais (as mesmas do rank público — GET /entries + RankPage):
//   - entries com deleted_at IS NULL
//   - jogador não excluído (players.deleted_at IS NULL)
//   - contas de teste (players.is_test_mod) fora
//   - runs anteriores (run_history) incluídas, sempre como encerradas
// Os filtros de exibição (desclassificados, 0 dias/0 kills, status, profissão)
// ficam em applyFilters (lib/statistics.ts).

import { supabase } from '../supabase';
import { config } from '../config';
import { ACTION_KEYS, applyFilters, computeOverview, type StatsFilters, type StatsRow } from './statistics';

const STATS_ENTRY_COLS = [
  'id, player_id, name, character_name, profession, days, kills, score, skills, traits, objectives, is_alive, sandbox_ok, created_at',
  'season_id, death_cause',
  'updated_at',        // último sync — vivo ativo × inativo (INACTIVE_AFTER_DAYS)
  'stats_synced_at',   // requer migration_v37
  ...ACTION_KEYS,
].join(', ');
// run_history (migration_v38) — mesmas colunas + marcadores do histórico
const STATS_HISTORY_COLS = [
  'id, player_id, name, character_name, profession, days, kills, score, skills, traits, objectives, sandbox_ok',
  'season_id, death_cause, stats_synced_at, is_partial, run_started_at, run_ended_at',
  ...ACTION_KEYS,
].join(', ');
const STATS_CACHE_MS = 3 * 60 * 1000;
let _statsRowsCache: { rows: StatsRow[]; season: { id: number; name: string; started_at: string } | null; at: number } | null = null;

export async function loadStatsRows() {
  if (_statsRowsCache && Date.now() - _statsRowsCache.at < STATS_CACHE_MS) return _statsRowsCache;

  const [entriesRes, historyRes, playersRes, seasonRes] = await Promise.all([
    supabase.from(config.tableName).select(STATS_ENTRY_COLS).is('deleted_at', null),
    supabase.from('run_history').select(STATS_HISTORY_COLS),
    supabase.from('players').select('id, deleted_at, is_test_mod'),
    supabase.from('seasons').select('id, name, started_at').eq('is_active', true).maybeSingle(),
  ]);
  const err = entriesRes.error ?? historyRes.error ?? playersRes.error ?? seasonRes.error;
  if (err) throw err;

  type PlayerRow = { id: number; deleted_at: string | null; is_test_mod: boolean | number };
  const hidden = new Set(((playersRes.data ?? []) as PlayerRow[])
    .filter(p => p.deleted_at != null || p.is_test_mod === true || p.is_test_mod === 1)
    .map(p => p.id));

  // Runs anteriores (run_history): sempre encerradas — uma run "viva" no histórico foi
  // abandonada sem morte registrada quando a partida nova com o mesmo nome começou.
  type HistoryRow = StatsRow & { is_partial: boolean | number; run_started_at: string | Date | null; run_ended_at: string | Date };
  const previous: StatsRow[] = ((historyRes.data ?? []) as HistoryRow[]).map(h => ({
    ...h,
    id:           `h${h.id}`,
    is_alive:     false,
    previous_run: true,
    partial:      h.is_partial === true || h.is_partial === 1,
    created_at:   h.run_started_at ?? h.run_ended_at,
  }));

  const rows = [...((entriesRes.data ?? []) as StatsRow[]), ...previous]
    .filter(r => r.player_id == null || !hidden.has(r.player_id));

  _statsRowsCache = { rows, season: (seasonRes.data as { id: number; name: string; started_at: string } | null) ?? null, at: Date.now() };
  return _statsRowsCache;
}


/** Filtros dos números oficiais (sem desclassificados, todas as runs válidas). */
export const OFFICIAL_FILTERS: StatsFilters = { status: 'all', profession: null, includeDisqualified: false };

/** Visão geral oficial — mesma fonte e mesmas regras de /estatisticas, na
 *  TEMPORADA ATIVA (quando a próxima começar, a home recomeça do zero sozinha). */
export async function officialOverview() {
  const { rows, season } = await loadStatsRows();
  return computeOverview(applyFilters(rows, { ...OFFICIAL_FILTERS, seasonId: season?.id ?? null }));
}

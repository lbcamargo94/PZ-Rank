// Camada central de estatísticas do campeonato (página /estatisticas).
//
// Funções puras: recebem as linhas de `entries` já lidas do banco e devolvem
// agregados prontos pra exibir. Nenhum cálculo estatístico fica no frontend nem
// espalhado por rotas — toda nova métrica entra aqui (e ganha teste em
// __tests__/statistics.test.ts).
//
// Unidade de contagem: "run" = uma partida de um personagem. Vem de duas tabelas:
//   - `entries`:     a run ATUAL de cada (jogador, nome de personagem)
//   - `run_history`: runs anteriores com o mesmo nome, arquivadas quando uma
//                    partida nova sobrescreve a linha (previous_run = true)
// "Jogador" = player_id distinto. Runs recuperadas só do jornal (partial) entram
// em contagens/sobrevivência/kills, mas não em profissões/traits/skills.

import { normalizeProfession } from './professions';
import { SKILL_NAMES } from './skills';
import { OFFICIAL_BASE_IDS } from './scoring';
import { isVersionAtLeast } from './version';

export interface StatsRow {
  id:             number | string;
  player_id:      number | null;
  name:           string;
  character_name: string | null;
  profession:     string | null;
  days:           number;
  kills:          number;
  score:          number;
  skills:         string | null;
  traits:         string | null;
  objectives:     unknown;
  is_alive:       boolean | number;
  sandbox_ok:     boolean | number;
  // pg-adapter devolve Date; sqlite-adapter devolve string ISO — sempre comparar via createdMs()
  created_at:     string | Date;
  // Preenchida quando os contadores de ações vieram do Companion (confiáveis).
  // NULL = contadores antigos/congelados → a run fica fora da seção de ações.
  stats_synced_at?: string | Date | null;
  season_id?:     number | null;
  // Versão do mod no último sync (entries.mod_version) — alguns contadores de ações
  // só são confiáveis a partir de uma versão (ACTION_MIN_MOD_VERSION)
  mod_version?:   string | null;
  // Último sync da run atual (entries.updated_at) — define vivo ativo × inativo
  updated_at?: string | Date | null;
  // Run anterior (run_history) — sempre conta como encerrada
  previous_run?: boolean;
  // Recuperada só do jornal (dias/kills/pontuação/causa): fica fora de
  // profissões, traits, skills e ações — ver isComplete()
  partial?: boolean;
  [action: string]: unknown;
}

/** Run com dados completos (profissão, traits, skills). */
export const isComplete = (r: StatsRow) => !r.partial;

const createdMs = (r: StatsRow) => new Date(r.created_at).getTime() || 0;

export type StatusFilter = 'all' | 'alive' | 'inactive' | 'dead';

export interface StatsFilters {
  status:              StatusFilter;
  profession:          string | null;   // nome canônico (normalizeProfession)
  includeDisqualified: boolean;
  // Temporada (seasons.id). null/ausente = todas. Runs sem season_id (antes da
  // v4.23.0 e sem backfill) só aparecem em "todas".
  seasonId?:           number | null;
}

export interface Holder {
  player_id:      number | null;
  name:           string;
  character_name: string | null;
  value:          number;
}

export interface Bucket { min: number; max: number | null; count: number }

// ── Helpers ────────────────────────────────────────────────────────────────

const isTrue = (v: boolean | number | null | undefined) => v === true || v === 1;

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 === 0 ? (s[mid - 1]! + s[mid]!) / 2 : s[mid]!;
}

const avg = (values: number[]) => values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
const pct = (part: number, total: number) => total === 0 ? 0 : (part / total) * 100;

function bucketize(values: number[], edges: Array<[number, number | null]>): Bucket[] {
  return edges.map(([min, max]) => ({
    min, max,
    count: values.filter(v => v >= min && (max === null || v <= max)).length,
  }));
}

// Desempate igual ao de /stats/legends: quem chegou primeiro (created_at) mantém o posto
function topHolder(rows: StatsRow[], value: (r: StatsRow) => number): Holder | null {
  let best: StatsRow | null = null;
  let bestVal = -Infinity;
  for (const r of rows) {
    const v = value(r);
    if (v > bestVal || (v === bestVal && best && createdMs(r) < createdMs(best))) { best = r; bestVal = v; }
  }
  if (!best || bestVal <= 0) return null;
  return { player_id: best.player_id, name: best.name, character_name: best.character_name, value: bestVal };
}

/** Traits: "base:slowhealer" → "slowhealer" (mesma normalização do resolveTrait do
 *  frontend). Traits de outros namespaces (mods) mantêm o prefixo pra não colidir. */
export function traitKey(raw: string): string {
  const t = raw.trim().replace(/\s+/g, '').toLowerCase();
  return t.startsWith('base:') ? t.slice(5) : t;
}

export function parseTraits(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(',').map(traitKey).filter(Boolean))];
}

// Skills em inglês (mod < v1.7 em alguns formatos) → nome PT; PT passa inalterado
const SKILL_PT = new Map(Object.entries(SKILL_NAMES).map(([id, pt]) => [id.toLowerCase(), pt]));
export const ALL_SKILLS: string[] = Object.values(SKILL_NAMES);

export function parseSkills(raw: string | null | undefined): Map<string, number> {
  const out = new Map<string, number>();
  if (!raw) return out;
  for (const part of raw.split(',')) {
    const t = part.trim();
    const idx = t.lastIndexOf(' ');
    if (idx <= 0) continue;
    const level = parseInt(t.slice(idx + 1), 10);
    if (isNaN(level)) continue;
    const name = t.slice(0, idx);
    out.set(SKILL_PT.get(name.toLowerCase()) ?? name, Math.max(0, Math.min(10, level)));
  }
  return out;
}

function basesBuilt(objectives: unknown): number {
  let obj = objectives;
  if (typeof obj === 'string') { try { obj = JSON.parse(obj); } catch { return 0; } }
  const bases = (obj as { bases?: Record<string, { has_base?: boolean }> } | null)?.bases;
  if (!bases) return 0;
  return [...OFFICIAL_BASE_IDS].filter(id => bases[id]?.has_base === true).length;
}

/** Partida encerrada com 0 dias E 0 kills não é uma run de verdade — na prática é o
 *  jogador recriando o personagem logo no início (sortear spawn/traits). Não entra
 *  no histórico nem nas estatísticas. Decisão de produto (2026-09-24); a regra é
 *  explicada aos jogadores no perfil ("Runs anteriores") e em /estatisticas. */
export function isEmptyRun(days: unknown, kills: unknown): boolean {
  return Number(days || 0) === 0 && Number(kills || 0) === 0;
}

/** Dias sem sincronizar pra uma run viva contar como INATIVA (decisão de produto,
 *  2026-09-25). O Companion sincroniza a cada ~10 min durante o jogo; pelos dados,
 *  quem passa de 14 dias sem sync tem runs curtas (média de 10 dias) — abandono. De
 *  7 a 14 dias ainda aparecem runs longas (média de 88 dias) só em pausa. */
export const INACTIVE_AFTER_DAYS = 14;

/** Viva, run atual, sem sync há mais de INACTIVE_AFTER_DAYS dias. Continua no rank e
 *  volta a ser ativa no próximo sync — só não entra na contagem de "vivos ativos". */
export function isInactive(r: StatsRow, now = Date.now()): boolean {
  if (!isTrue(r.is_alive) || r.previous_run || !r.updated_at) return false;
  const last = new Date(r.updated_at).getTime();
  return Number.isFinite(last) && now - last > INACTIVE_AFTER_DAYS * 86_400_000;
}

// ── Filtro oficial ─────────────────────────────────────────────────────────
// As linhas já chegam sem deleted_at, sem jogador excluído e sem conta de teste
// (ver routes/stats.ts). Aqui só entram os filtros escolhidos na página.
// Desclassificados (sandbox_ok=false) ficam fora por padrão — mesma regra do
// rank público, de /stats/global, /stats/legends e do fechamento de temporada.
export function applyFilters(rows: StatsRow[], f: StatsFilters, now = Date.now()): StatsRow[] {
  return rows.filter(r => {
    // Partida ENCERRADA com 0 dias e 0 kills não conta (personagem recriado no
    // início). Viva com 0/0 = recém-criada, ainda em jogo: continua contando.
    if (!isTrue(r.is_alive) && isEmptyRun(r.days, r.kills)) return false;
    if (f.seasonId != null && Number(r.season_id) !== f.seasonId) return false;
    if (!f.includeDisqualified && r.sandbox_ok !== null && !isTrue(r.sandbox_ok)) return false;
    // 'alive' = vivos ATIVOS; 'inactive' = vivos sem sync há 14+ dias
    if (f.status === 'alive' && (!isTrue(r.is_alive) || isInactive(r, now))) return false;
    if (f.status === 'inactive' && !isInactive(r, now)) return false;
    if (f.status === 'dead'  &&  isTrue(r.is_alive)) return false;
    if (f.profession && normalizeProfession(r.profession) !== f.profession) return false;
    return true;
  });
}

// ── Seções ─────────────────────────────────────────────────────────────────

export function computeOverview(rows: StatsRow[], now = Date.now()) {
  const aliveAll = rows.filter(r => isTrue(r.is_alive)).length;
  const inactive = rows.filter(r => isInactive(r, now)).length;
  const alive    = aliveAll - inactive;   // vivos ATIVOS
  return {
    players:     new Set(rows.map(r => r.player_id).filter(id => id != null)).size,
    runs:        rows.length,
    previous_runs: rows.filter(r => r.previous_run).length,
    alive,
    alive_inactive: inactive,
    dead:        rows.length - aliveAll,
    total_kills: rows.reduce((s, r) => s + (r.kills || 0), 0),
    total_days:  rows.reduce((s, r) => s + (r.days || 0), 0),
    bases_built: rows.reduce((s, r) => s + basesBuilt(r.objectives), 0),
    skills_maxed: rows.reduce((s, r) => s + [...parseSkills(r.skills).values()].filter(l => l >= 10).length, 0),
    // Só runs com contadores confiáveis (ver computeActions)
    action_runs:   rows.filter(hasActionStats).length,
    items_crafted: rows.filter(r => hasActionStatsFor(r, 'items_crafted')).reduce((s, r) => s + actionValue(r, 'items_crafted'), 0),
    meals_cooked:  rows.filter(r => hasActionStatsFor(r, 'meals_cooked')).reduce((s, r) => s + actionValue(r, 'meals_cooked'), 0),
    houses_looted: rows.filter(r => hasActionStatsFor(r, 'houses_looted')).reduce((s, r) => s + actionValue(r, 'houses_looted'), 0),
  };
}

export function computeProfessions(allRows: StatsRow[]) {
  const rows = allRows.filter(isComplete);
  const groups = new Map<string, StatsRow[]>();
  for (const r of rows) {
    const p = normalizeProfession(r.profession);
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p)!.push(r);
  }
  return [...groups.entries()]
    .map(([name, g]) => ({
      name,
      runs:      g.length,
      players:   new Set(g.map(r => r.player_id).filter(id => id != null)).size,
      pct:       pct(g.length, rows.length),
      alive:     g.filter(r => isTrue(r.is_alive)).length,
      avg_days:  avg(g.map(r => r.days || 0)),
      avg_kills: avg(g.map(r => r.kills || 0)),
    }))
    .sort((a, b) => b.runs - a.runs || a.name.localeCompare(b.name));
}

/** Um trait conta 1x por run (duplicatas no CSV são ignoradas). pct = % das runs. */
export function computeTraits(allRows: StatsRow[]) {
  const rows = allRows.filter(isComplete);
  const runs    = new Map<string, number>();
  const players = new Map<string, Set<number>>();
  const days    = new Map<string, number[]>();
  for (const r of rows) {
    for (const t of parseTraits(r.traits)) {
      runs.set(t, (runs.get(t) ?? 0) + 1);
      if (!players.has(t)) players.set(t, new Set());
      if (r.player_id != null) players.get(t)!.add(r.player_id);
      if (!days.has(t)) days.set(t, []);
      days.get(t)!.push(r.days || 0);
    }
  }
  return [...runs.entries()]
    .map(([key, n]) => ({
      key,
      runs:     n,
      players:  players.get(key)!.size,
      pct:      pct(n, rows.length),
      avg_days: avg(days.get(key)!),
    }))
    .sort((a, b) => b.runs - a.runs || a.key.localeCompare(b.key));
}

/** "Builds": conjuntos COMPLETOS de traits idênticos usados por 2+ runs.
 *  (Pares de traits não foram usados: com ~20 traits por run, os pares mais
 *  frequentes só repetem os traits mais populares e não dizem nada novo.) */
export function computeTraitBuilds(allRows: StatsRow[], limit = 10) {
  const rows = allRows.filter(isComplete);
  const sets = new Map<string, { traits: string[]; runs: number; days: number[] }>();
  for (const r of rows) {
    const traits = parseTraits(r.traits).sort();
    if (traits.length === 0) continue;
    const k = traits.join(',');
    if (!sets.has(k)) sets.set(k, { traits, runs: 0, days: [] });
    const s = sets.get(k)!;
    s.runs++;
    s.days.push(r.days || 0);
  }
  return [...sets.values()]
    .filter(s => s.runs >= 2)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, limit)
    .map(s => ({ traits: s.traits, runs: s.runs, avg_days: avg(s.days) }));
}

const DAY_BUCKETS:  Array<[number, number | null]> = [[0, 7], [8, 30], [31, 90], [91, 180], [181, 365], [366, null]];
const KILL_BUCKETS: Array<[number, number | null]> = [[0, 100], [101, 1_000], [1_001, 10_000], [10_001, 50_000], [50_001, null]];

export function computeSurvival(rows: StatsRow[]) {
  const all   = rows.map(r => r.days || 0);
  const dead  = rows.filter(r => !isTrue(r.is_alive)).map(r => r.days || 0);
  const alive = rows.filter(r =>  isTrue(r.is_alive)).map(r => r.days || 0);
  return {
    avg_days:    avg(all),
    median_days: median(all),
    max_days:    all.length ? Math.max(...all) : 0,
    min_days:    all.length ? Math.min(...all) : 0,
    avg_dead:    avg(dead),
    avg_alive:   avg(alive),
    buckets:     bucketize(all, DAY_BUCKETS),
    longest:     topHolder(rows, r => r.days || 0),
  };
}

export function computeZombies(rows: StatsRow[]) {
  const kills   = rows.map(r => r.kills || 0);
  const total   = kills.reduce((a, b) => a + b, 0);
  const days    = rows.reduce((s, r) => s + (r.days || 0), 0);
  const players = new Set(rows.map(r => r.player_id).filter(id => id != null)).size;
  const dead    = rows.filter(r => !isTrue(r.is_alive)).map(r => r.kills || 0);
  return {
    total,
    avg_per_player: players === 0 ? 0 : total / players,
    avg_per_run:    avg(kills),
    median_per_run: median(kills),
    per_day:        days === 0 ? 0 : total / days,
    avg_before_death: avg(dead),
    max:            kills.length ? Math.max(...kills) : 0,
    buckets:        bucketize(kills, KILL_BUCKETS),
    top:            topHolder(rows, r => r.kills || 0),
  };
}

/** Skills: toda run conta — skill ausente no CSV conta como nível 0 (o mod
 *  exporta todas as skills, inclusive nível 0, desde o B42). "Nunca evoluiu" =
 *  nível 0; bônus de profissão/trait já tiram a skill do 0 desde o início. */
export function computeSkills(allRows: StatsRow[]) {
  const rows = allRows.filter(isComplete);
  const parsed = rows.map(r => parseSkills(r.skills));
  const names = new Set<string>(ALL_SKILLS);
  for (const m of parsed) for (const k of m.keys()) names.add(k);

  return [...names]
    .map(name => {
      const levels = parsed.map(m => m.get(name) ?? 0);
      const dist = Array.from({ length: 11 }, (_, lvl) => levels.filter(l => l === lvl).length);
      const count10 = dist[10]!;
      return {
        name,
        avg:     avg(levels),
        max:     levels.length ? Math.max(...levels) : 0,
        count10,
        pct10:   pct(count10, rows.length),
        count0:  dist[0]!,
        dist,
      };
    })
    .sort((a, b) => b.pct10 - a.pct10 || b.avg - a.avg);
}

// ── Ações dos sobreviventes ────────────────────────────────────────────────
// Fonte: colunas de contadores em `entries`, SÓ de runs com stats_synced_at
// (stats enviadas pelo Companion v2.5.0+). Registro central: pra adicionar uma
// ação nova, basta incluí-la aqui (+ rótulo no frontend, RecordsSection/ActionSection).
//
// kind 'sum'  → contador acumulado; faz sentido somar entre runs (total do campeonato)
// kind 'peak' → contagem de itens distintos ou recorde pessoal (cidades visitadas,
//               maior tempo sem dormir…); somar entre runs não significa nada,
//               então a página mostra média/máximo, sem total.
export const ACTION_GROUPS = [
  { id: 'craft', actions: [
    { key: 'items_crafted',      kind: 'sum'  },
    { key: 'materials_crafted',  kind: 'sum'  },
    { key: 'weapons_crafted',    kind: 'sum'  },
    { key: 'forged_weapons',     kind: 'sum'  },
    { key: 'clothes_crafted',    kind: 'sum'  },
    { key: 'furniture_crafted',  kind: 'sum'  },
    { key: 'structures_built',   kind: 'sum'  },
    { key: 'stone_structures',   kind: 'sum'  },
    { key: 'ceramic_items',      kind: 'sum'  },
    { key: 'stations_used',      kind: 'peak' },
  ] },
  { id: 'food', actions: [
    { key: 'meals_cooked',       kind: 'sum'  },
    { key: 'crops_planted',      kind: 'sum'  },
    { key: 'crops_harvested',    kind: 'sum'  },
    { key: 'eggs_collected',     kind: 'sum'  },
    { key: 'milk_produced',      kind: 'sum'  },
    { key: 'cheese_produced',    kind: 'sum'  },
    { key: 'water_collected',    kind: 'sum'  },
    { key: 'days_no_canned',     kind: 'peak' },
  ] },
  { id: 'nature', actions: [
    { key: 'animals_killed',     kind: 'sum'  },
    { key: 'fish_caught',        kind: 'sum'  },
    { key: 'animal_tracks',      kind: 'sum'  },
    { key: 'trees_cut',          kind: 'sum'  },
    { key: 'animal_species',     kind: 'peak' },
  ] },
  { id: 'exploration', actions: [
    { key: 'houses_looted',      kind: 'sum'  },
    { key: 'doors_opened',       kind: 'sum'  },
    { key: 'basements_explored', kind: 'sum'  },
    { key: 'km_driven',          kind: 'sum'  },
    { key: 'cities_visited',     kind: 'peak' },
    { key: 'spiffo_visited',     kind: 'peak' },
    { key: 'military_visited',   kind: 'peak' },
  ] },
  { id: 'survival', actions: [
    { key: 'books_read',          kind: 'sum'  },
    { key: 'sleep_locations',     kind: 'peak' },
    { key: 'hours_without_sleep', kind: 'peak' },
  ] },
] as const satisfies ReadonlyArray<{ id: string; actions: ReadonlyArray<{ key: string; kind: 'sum' | 'peak' }> }>;

export const ACTION_KEYS: readonly string[] = ACTION_GROUPS.flatMap(g => g.actions.map(a => a.key));
const ACTION_KEY_SET = new Set(ACTION_KEYS);

const ACTION_BUCKETS: Array<[number, number | null]> = [[0, 0], [1, 10], [11, 100], [101, 1_000], [1_001, 10_000], [10_001, null]];

export const hasActionStats = (r: StatsRow) => r.stats_synced_at != null;

/** Contadores que o mod só passou a contar de verdade a partir de uma versão. Até a
 *  v2.25.5 o mod escutava o sistema de crafting antigo (ISCraftAction) e um evento de
 *  loot no lugar de "encher recipiente" — esses contadores chegavam SEMPRE 0 (0 em 54
 *  runs, média de 89 dias). Runs de versões anteriores ficam fora desses contadores
 *  (senão os zeros falsos derrubariam médias e percentuais). Runs anteriores do
 *  histórico não guardam a versão do mod — ficam fora também. */
export const ACTION_MIN_MOD_VERSION: Record<string, string> = {
  ...Object.fromEntries(
    ['items_crafted', 'meals_cooked', 'water_collected', 'materials_crafted', 'weapons_crafted',
     'clothes_crafted', 'ceramic_items', 'forged_weapons', 'cheese_produced', 'stations_used']
      .map(k => [k, '2.26.0']),
  ),
  // v2.27.0: leite contava chamadas (inflado) e passou a litros; km descartava o
  // trajeto (floor + zerar); rastros e base militar nunca contavam (evento
  // inexistente / palavra-chave). Valores anteriores não são comparáveis.
  ...Object.fromEntries(
    ['milk_produced', 'km_driven', 'animal_tracks', 'military_visited'].map(k => [k, '2.27.0']),
  ),
};

/** A run tem valor confiável PARA ESTE contador (stats do Companion + versão do mod). */
export function hasActionStatsFor(r: StatsRow, key: string): boolean {
  if (!hasActionStats(r)) return false;
  const min = ACTION_MIN_MOD_VERSION[key];
  return !min || isVersionAtLeast(r.mod_version ?? null, min);
}
const actionValue = (r: StatsRow, key: string) => {
  const v = Number(r[key]);
  return Number.isFinite(v) && v > 0 ? v : 0;
};

export function computeActions(rows: StatsRow[]) {
  const withStats = rows.filter(hasActionStats);
  const groups = ACTION_GROUPS.map(g => ({
    id: g.id,
    actions: g.actions.map(({ key, kind }) => {
      const pool   = withStats.filter(r => hasActionStatsFor(r, key));
      const values = pool.map(r => actionValue(r, key));
      const total  = values.reduce((a, b) => a + b, 0);
      const done   = values.filter(v => v > 0).length;
      return {
        key, kind,
        total:       kind === 'sum' ? total : null,
        avg:         avg(values),
        median:      median(values),
        max:         values.length ? Math.max(...values) : 0,
        runs_done:   done,                           // runs que fizeram ao menos 1×
        pct_done:    pct(done, pool.length),
        runs:        pool.length,                    // runs com dado confiável deste contador
        since_mod:   ACTION_MIN_MOD_VERSION[key] ?? null,
        buckets:     bucketize(values, ACTION_BUCKETS),
        top:         topHolder(pool, r => actionValue(r, key)),
      };
    }),
  }));
  return {
    runs_with_data: withStats.length,
    runs_total:     rows.length,
    groups,
  };
}

// ── Causas de morte ────────────────────────────────────────────────────────
// Chaves que o mod detecta (PZCommunityRank RankDeathCause.lua, v2.15+). Versões
// antigas mandavam o texto da tela de morte ("Você sobreviveu por 6 horas.") no
// lugar da causa — qualquer coisa fora desta lista conta como desconhecida.
export const DEATH_CAUSES = [
  'zombie', 'zombie_horde', 'zombie_virus', 'vehicle', 'pvp', 'burned', 'bled',
  'infection', 'bleach', 'poison', 'fall', 'cold', 'sick', 'hunger', 'thirst',
] as const;
export type DeathCause = typeof DEATH_CAUSES[number];
const DEATH_CAUSE_SET = new Set<string>(DEATH_CAUSES);
/** Causas "por zumbi" — somadas num destaque próprio da seção. */
export const ZOMBIE_CAUSES = new Set<string>(['zombie', 'zombie_horde', 'zombie_virus']);

export function normalizeDeathCause(raw: unknown): DeathCause | null {
  if (typeof raw !== 'string') return null;
  const k = raw.trim().toLowerCase();
  return DEATH_CAUSE_SET.has(k) ? (k as DeathCause) : null;
}

/** Só mortes (runs encerradas). Percentuais sobre as mortes com causa CONHECIDA;
 *  `coverage` diz quantas das mortes têm causa — a página mostra isso junto. */
export function computeDeaths(rows: StatsRow[]) {
  const dead  = rows.filter(r => !isTrue(r.is_alive));
  const known = dead.map(r => ({ r, cause: normalizeDeathCause(r['death_cause']) }))
    .filter((x): x is { r: StatsRow; cause: DeathCause } => x.cause !== null);

  const byCause = new Map<DeathCause, StatsRow[]>();
  for (const { r, cause } of known) {
    if (!byCause.has(cause)) byCause.set(cause, []);
    byCause.get(cause)!.push(r);
  }
  const causes = [...byCause.entries()]
    .map(([cause, g]) => ({
      cause,
      deaths:    g.length,
      pct:       pct(g.length, known.length),
      avg_days:  avg(g.map(r => r.days || 0)),
      avg_kills: avg(g.map(r => r.kills || 0)),
    }))
    .sort((a, b) => b.deaths - a.deaths || a.cause.localeCompare(b.cause));

  const zombieDeaths = known.filter(x => ZOMBIE_CAUSES.has(x.cause)).length;
  return {
    deaths:        dead.length,
    known:         known.length,
    coverage:      pct(known.length, dead.length),
    zombie_pct:    pct(zombieDeaths, known.length),
    causes,
  };
}

// ── Evolução semanal ───────────────────────────────────────────────────────
// Semanas começam na segunda-feira 00:00 no horário de Brasília (UTC-3 fixo — o
// Brasil não tem horário de verão desde 2019). Chave = data da segunda (YYYY-MM-DD).
const BRT_OFFSET_MS = 3 * 3_600_000;
export function weekStart(d: string | Date): string | null {
  const t = new Date(d).getTime();
  if (!Number.isFinite(t)) return null;
  const local = new Date(t - BRT_OFFSET_MS);             // relógio de Brasília em campos UTC
  const dow = (local.getUTCDay() + 6) % 7;                // 0 = segunda
  local.setUTCDate(local.getUTCDate() - dow);
  return local.toISOString().slice(0, 10);
}

/** Início da run: run_started_at (desde v4.23.0) ou, antes disso, a criação da linha.
 *  Runs recuperadas só do jornal não têm início conhecido → null. */
function runStartedAt(r: StatsRow): string | Date | null {
  if (r.partial) return null;
  const started = (r['run_started_at'] as string | Date | null | undefined) ?? null;
  // Histórico sem início registrado: não chuta (created_at dele é o fim da run)
  if (r.previous_run) return started;
  return started ?? r.created_at ?? null;
}
/** Fim de uma run encerrada: histórico → run_ended_at; atual morta → último sync
 *  (depois da morte a run não é mais gravada, então updated_at = momento da morte). */
function runEndedAt(r: StatsRow): string | Date | null {
  if (isTrue(r.is_alive)) return null;
  return r.previous_run
    ? ((r['run_ended_at'] as string | Date | null | undefined) ?? null)
    : (r.updated_at ?? null);
}

export interface SignupRow { created_at: string | Date | null }

/** Série semanal da temporada: runs iniciadas, mortes (com média de dias vividos) e
 *  novos inscritos. Semanas sem nada aparecem com zero, de `from` até `to`. */
export function computeTimeline(rows: StatsRow[], signups: SignupRow[], from: string | Date | null, to = new Date()) {
  const weeks = new Map<string, { runs_started: number; deaths: number; death_days: number[]; signups: number }>();
  const bump = (k: string | null) => {
    if (!k) return null;
    if (!weeks.has(k)) weeks.set(k, { runs_started: 0, deaths: 0, death_days: [], signups: 0 });
    return weeks.get(k)!;
  };
  const inRange = (k: string | null) => k !== null && (!fromKey || k >= fromKey) && k <= toKey;
  const fromKey = from ? weekStart(from) : null;
  const toKey = weekStart(to)!;

  for (const r of rows) {
    const s = runStartedAt(r);
    const ks = s ? weekStart(s) : null;
    if (inRange(ks)) bump(ks)!.runs_started++;
    const e = runEndedAt(r);
    const ke = e ? weekStart(e) : null;
    if (inRange(ke)) { const w = bump(ke)!; w.deaths++; w.death_days.push(r.days || 0); }
  }
  for (const p of signups) {
    const k = p.created_at ? weekStart(p.created_at) : null;
    if (inRange(k)) bump(k)!.signups++;
  }

  // Preenche semanas vazias entre a primeira e a última
  const keys = [...weeks.keys()].sort();
  const first = fromKey ?? keys[0];
  if (!first) return { weeks: [] };
  const out: Array<{ week_start: string; runs_started: number; deaths: number; avg_days_at_death: number; signups: number }> = [];
  for (let d = new Date(`${first}T00:00:00Z`); d.toISOString().slice(0, 10) <= toKey; d.setUTCDate(d.getUTCDate() + 7)) {
    const k = d.toISOString().slice(0, 10);
    const w = weeks.get(k);
    out.push({
      week_start:        k,
      runs_started:      w?.runs_started ?? 0,
      deaths:            w?.deaths ?? 0,
      avg_days_at_death: w ? avg(w.death_days) : 0,
      signups:           w?.signups ?? 0,
    });
  }
  return { weeks: out };
}

// ── Rankings e recordes ────────────────────────────────────────────────────

export const RANKING_METRICS = ['kills', 'days', 'score', 'skills10', 'skill_levels', 'bases'] as const;
export type RankingMetric = typeof RANKING_METRICS[number] | `skill:${string}` | `action:${string}`;

export function isRankingMetric(m: string): m is RankingMetric {
  return (RANKING_METRICS as readonly string[]).includes(m)
    || (m.startsWith('skill:') && m.length > 6)
    || (m.startsWith('action:') && ACTION_KEY_SET.has(m.slice(7)));
}

function metricValue(metric: RankingMetric): (r: StatsRow) => number {
  switch (metric) {
    case 'kills':        return r => r.kills || 0;
    case 'days':         return r => r.days || 0;
    case 'score':        return r => r.score || 0;
    case 'skills10':     return r => [...parseSkills(r.skills).values()].filter(l => l >= 10).length;
    case 'skill_levels': return r => [...parseSkills(r.skills).values()].reduce((a, b) => a + b, 0);
    case 'bases':        return r => basesBuilt(r.objectives);
    default: {
      if (metric.startsWith('action:')) {
        const key = metric.slice('action:'.length);
        return r => actionValue(r, key);
      }
      const skill = metric.slice('skill:'.length);
      return r => parseSkills(r.skills).get(skill) ?? 0;
    }
  }
}

export function computeRanking(rows: StatsRow[], metric: RankingMetric, limit = 50) {
  const value = metricValue(metric);
  // Ações: só runs com contadores confiáveis (stats_synced_at)
  const pool = metric.startsWith('action:')
    ? rows.filter(r => hasActionStatsFor(r, metric.slice('action:'.length)))
    : rows;
  return pool
    .map(r => ({ r, v: value(r) }))
    .filter(x => x.v > 0)
    .sort((a, b) => b.v - a.v || createdMs(a.r) - createdMs(b.r))
    .slice(0, limit)
    .map((x, i) => ({
      position:       i + 1,
      player_id:      x.r.player_id,
      name:           x.r.name,
      character_name: x.r.character_name,
      is_alive:       isTrue(x.r.is_alive),
      previous_run:   !!x.r.previous_run,
      value:          x.v,
    }));
}

// Recordes de ações exibidos em "Recordes do campeonato" (o ranking vale pra todas)
export const ACTION_RECORDS = [
  'items_crafted', 'meals_cooked', 'houses_looted', 'cities_visited', 'eggs_collected',
  'milk_produced', 'animals_killed', 'fish_caught', 'trees_cut', 'km_driven',
] as const;

export function computeRecords(rows: StatsRow[]) {
  const withStats = rows.filter(hasActionStats);
  const metrics: RankingMetric[] = [...RANKING_METRICS, ...ACTION_RECORDS.map(k => `action:${k}` as const)];
  return metrics
    .map(metric => ({
      metric,
      holder: topHolder(
        metric.startsWith('action:') ? withStats.filter(r => hasActionStatsFor(r, metric.slice('action:'.length))) : rows,
        metricValue(metric)),
    }))
    .filter((r): r is { metric: RankingMetric; holder: Holder } => r.holder !== null);
}

// ── Curiosidades (estatística descritiva — nunca causalidade) ──────────────
// Grupos com menos de MIN_GROUP runs ficam de fora: média de 1–2 runs é ruído.
export const MIN_GROUP = 5;

export function computeCuriosities(
  professions: ReturnType<typeof computeProfessions>,
  traits:      ReturnType<typeof computeTraits>,
  skills:      ReturnType<typeof computeSkills>,
  zombies:     ReturnType<typeof computeZombies>,
  rows:        StatsRow[],
) {
  const out: Array<Record<string, unknown> & { kind: string }> = [];
  const bigProfs = professions.filter(p => p.runs >= MIN_GROUP);

  const bestDays = [...bigProfs].sort((a, b) => b.avg_days - a.avg_days)[0];
  if (bestDays) out.push({ kind: 'profession_longest', name: bestDays.name, value: bestDays.avg_days, runs: bestDays.runs });

  const bestKills = [...bigProfs].sort((a, b) => b.avg_kills - a.avg_kills)[0];
  if (bestKills) out.push({ kind: 'profession_kills', name: bestKills.name, value: bestKills.avg_kills, runs: bestKills.runs });

  if (traits[0]) out.push({ kind: 'trait_most_used', key: traits[0].key, value: traits[0].pct });

  const bigTraits = traits.filter(t => t.runs >= MIN_GROUP);
  const traitDays = [...bigTraits].sort((a, b) => b.avg_days - a.avg_days)[0];
  if (traitDays) out.push({ kind: 'trait_longest', key: traitDays.key, value: traitDays.avg_days, runs: traitDays.runs });

  if (skills.length && rows.length) {
    out.push({ kind: 'skill_most_maxed',  name: skills[0]!.name,                 value: skills[0]!.pct10 });
    const last = [...skills].sort((a, b) => a.pct10 - b.pct10 || a.avg - b.avg)[0]!;
    out.push({ kind: 'skill_least_maxed', name: last.name, value: last.pct10 });
  }

  const dead = rows.filter(r => !isTrue(r.is_alive)).length;
  if (dead > 0) out.push({ kind: 'kills_before_death', value: zombies.avg_before_death, runs: dead });

  if (rows.length > 0) {
    const over30 = rows.filter(r => (r.days || 0) > 30).length;
    out.push({ kind: 'survived_30', value: pct(over30, rows.length), runs: over30 });
  }
  return out;
}

// ── Montagem completa ──────────────────────────────────────────────────────

export interface TimelineContext {
  signups: SignupRow[];          // jogadores aprovados (created_at = cadastro)
  from:    string | Date | null;  // início da temporada filtrada (null = desde o começo)
  to?:     string | Date | null;  // fim da temporada (encerrada) ou agora
}

export function computeChampionshipStats(allRows: StatsRow[], filters: StatsFilters, timeline?: TimelineContext) {
  const rows        = applyFilters(allRows, filters);
  const professions = computeProfessions(rows);
  const traits      = computeTraits(rows);
  const skills      = computeSkills(rows);
  const survival    = computeSurvival(rows);
  const zombies     = computeZombies(rows);
  // Lista de profissões do filtro sempre vem do conjunto sem filtro de profissão,
  // senão o seletor encolheria pra uma opção só depois de escolher uma.
  const professionOptions = computeProfessions(applyFilters(allRows, { ...filters, profession: null }))
    .map(p => p.name);

  return {
    overview:     computeOverview(rows),
    professions,
    traits,
    trait_builds: computeTraitBuilds(rows),
    survival,
    zombies,
    skills,
    records:      computeRecords(rows),
    actions:      computeActions(rows),
    deaths:       computeDeaths(rows),
    timeline:     timeline
      ? computeTimeline(rows, timeline.signups, timeline.from, timeline.to ? new Date(timeline.to) : new Date())
      : { weeks: [] },
    curiosities:  computeCuriosities(professions, traits, skills, zombies, rows),
    profession_options: professionOptions,
  };
}

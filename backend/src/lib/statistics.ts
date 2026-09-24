// Camada central de estatísticas do campeonato (página /estatisticas).
//
// Funções puras: recebem as linhas de `entries` já lidas do banco e devolvem
// agregados prontos pra exibir. Nenhum cálculo estatístico fica no frontend nem
// espalhado por rotas — toda nova métrica entra aqui (e ganha teste em
// __tests__/statistics.test.ts).
//
// Unidade de contagem: "run" = uma linha de `entries` (um personagem de um
// jogador). "Jogador" = player_id distinto. Um jogador pode ter várias runs
// (personagens diferentes); uma nova run com o MESMO nome de personagem
// sobrescreve a linha anterior, então essas runs antigas não existem mais no
// banco — limitação documentada em docs/estatisticas.md.

import { normalizeProfession } from './professions';
import { SKILL_NAMES } from './skills';
import { OFFICIAL_BASE_IDS } from './scoring';

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
}

const createdMs = (r: StatsRow) => new Date(r.created_at).getTime() || 0;

export type StatusFilter = 'all' | 'alive' | 'dead';

export interface StatsFilters {
  status:              StatusFilter;
  profession:          string | null;   // nome canônico (normalizeProfession)
  includeDisqualified: boolean;
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

// ── Filtro oficial ─────────────────────────────────────────────────────────
// As linhas já chegam sem deleted_at, sem jogador excluído e sem conta de teste
// (ver routes/stats.ts). Aqui só entram os filtros escolhidos na página.
// Desclassificados (sandbox_ok=false) ficam fora por padrão — mesma regra do
// rank público, de /stats/global, /stats/legends e do fechamento de temporada.
export function applyFilters(rows: StatsRow[], f: StatsFilters): StatsRow[] {
  return rows.filter(r => {
    if (!f.includeDisqualified && r.sandbox_ok !== null && !isTrue(r.sandbox_ok)) return false;
    if (f.status === 'alive' && !isTrue(r.is_alive)) return false;
    if (f.status === 'dead'  &&  isTrue(r.is_alive)) return false;
    if (f.profession && normalizeProfession(r.profession) !== f.profession) return false;
    return true;
  });
}

// ── Seções ─────────────────────────────────────────────────────────────────

export function computeOverview(rows: StatsRow[]) {
  const alive = rows.filter(r => isTrue(r.is_alive)).length;
  return {
    players:     new Set(rows.map(r => r.player_id).filter(id => id != null)).size,
    runs:        rows.length,
    alive,
    dead:        rows.length - alive,
    total_kills: rows.reduce((s, r) => s + (r.kills || 0), 0),
    total_days:  rows.reduce((s, r) => s + (r.days || 0), 0),
    bases_built: rows.reduce((s, r) => s + basesBuilt(r.objectives), 0),
    skills_maxed: rows.reduce((s, r) => s + [...parseSkills(r.skills).values()].filter(l => l >= 10).length, 0),
  };
}

export function computeProfessions(rows: StatsRow[]) {
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
export function computeTraits(rows: StatsRow[]) {
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
export function computeTraitBuilds(rows: StatsRow[], limit = 10) {
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
export function computeSkills(rows: StatsRow[]) {
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

// ── Rankings e recordes ────────────────────────────────────────────────────

export const RANKING_METRICS = ['kills', 'days', 'score', 'skills10', 'skill_levels', 'bases'] as const;
export type RankingMetric = typeof RANKING_METRICS[number] | `skill:${string}`;

export function isRankingMetric(m: string): m is RankingMetric {
  return (RANKING_METRICS as readonly string[]).includes(m) || (m.startsWith('skill:') && m.length > 6);
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
      const skill = metric.slice('skill:'.length);
      return r => parseSkills(r.skills).get(skill) ?? 0;
    }
  }
}

export function computeRanking(rows: StatsRow[], metric: RankingMetric, limit = 50) {
  const value = metricValue(metric);
  return rows
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
      value:          x.v,
    }));
}

export function computeRecords(rows: StatsRow[]) {
  return RANKING_METRICS
    .map(metric => ({ metric, holder: topHolder(rows, metricValue(metric)) }))
    .filter(r => r.holder !== null);
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

export function computeChampionshipStats(allRows: StatsRow[], filters: StatsFilters) {
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
    curiosities:  computeCuriosities(professions, traits, skills, zombies, rows),
    profession_options: professionOptions,
  };
}

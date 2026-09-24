import { describe, it, expect } from 'vitest';
import {
  ACTION_KEYS, applyFilters, computeActions, computeChampionshipStats, computeOverview, computeProfessions, computeRecords,
  computeRanking, computeSkills, computeSurvival, computeTraitBuilds, computeTraits,
  isRankingMetric, median, parseSkills, traitKey,
  type StatsFilters, type StatsRow,
} from '../lib/statistics';
import { normalizeProfession } from '../lib/professions';

let nextId = 1;
function row(p: Partial<StatsRow> = {}): StatsRow {
  const id = nextId++;
  return {
    id, player_id: id, name: `P${id}`, character_name: `C${id}`,
    profession: 'Pedreiro', days: 0, kills: 0, score: 0,
    skills: null, traits: null, objectives: null,
    is_alive: true, sandbox_ok: true,
    created_at: `2026-08-01T00:00:${String(id % 60).padStart(2, '0')}Z`,
    ...p,
  };
}

const ALL: StatsFilters = { status: 'all', profession: null, includeDisqualified: false };

describe('normalizeProfession', () => {
  it('agrupa o mesmo ofício exportado em idiomas diferentes', () => {
    expect(normalizeProfession('Lumberjack')).toBe('Lenhador');
    expect(normalizeProfession('Bûcheron')).toBe('Lenhador');
    expect(normalizeProfession('Lenhador')).toBe('Lenhador');
    expect(normalizeProfession('Construction Worker')).toBe('Pedreiro');
    expect(normalizeProfession('Maçon')).toBe('Pedreiro');
  });
  it('agrupa traduções PTBR antigas e variações de caixa/hífen', () => {
    expect(normalizeProfession('Construtor civil')).toBe('Pedreiro');
    expect(normalizeProfession('Desempregado')).toBe('Profissão Personalizada');
    expect(normalizeProfession('Custom Occupation')).toBe('Profissão Personalizada');
    expect(normalizeProfession('Guarda-florestal')).toBe('Guarda Florestal');
  });
  it('mantém profissões desconhecidas (mods) e trata vazio', () => {
    expect(normalizeProfession('Caçador de Recompensas')).toBe('Caçador de Recompensas');
    expect(normalizeProfession('')).toBe('Desconhecida');
    expect(normalizeProfession(null)).toBe('Desconhecida');
  });
});

describe('profissões', () => {
  it('10 runs, 3 Bombeiro → 30%', () => {
    const rows = [
      ...Array.from({ length: 3 }, () => row({ profession: 'Bombeiro' })),
      ...Array.from({ length: 2 }, () => row({ profession: 'Carpinteiro' })),
      ...Array.from({ length: 5 }, () => row({ profession: 'Veterano' })),
    ];
    const profs = computeProfessions(rows);
    const bombeiro = profs.find(p => p.name === 'Bombeiro')!;
    expect(bombeiro.runs).toBe(3);
    expect(bombeiro.pct).toBeCloseTo(30);
    expect(profs[0]!.name).toBe('Veterano');
  });
  it('conta jogadores distintos separado de runs', () => {
    const rows = [row({ player_id: 1, profession: 'Bombeiro' }), row({ player_id: 1, profession: 'Firefighter' })];
    const [p] = computeProfessions(rows);
    expect(p!.runs).toBe(2);
    expect(p!.players).toBe(1);
  });
});

describe('traits', () => {
  it('normaliza chave igual ao resolveTrait do frontend', () => {
    expect(traitKey('base:slowhealer')).toBe('slowhealer');
    expect(traitKey('base:out of shape')).toBe('outofshape');
    expect(traitKey('SlowHealer')).toBe('slowhealer');
    expect(traitKey('thisisyourlife:origin_rosewood')).toBe('thisisyourlife:origin_rosewood');
  });
  it('run com vários traits conta cada trait uma vez; duplicata no CSV não conta 2x', () => {
    const rows = [
      row({ traits: 'base:slowhealer,base:athletic,base:slowhealer' }),
      row({ traits: 'base:slowhealer' }),
      row({ traits: null }),
      row({ traits: 'base:athletic' }),
    ];
    const t = computeTraits(rows);
    expect(t.find(x => x.key === 'slowhealer')).toMatchObject({ runs: 2, pct: 50 });
    expect(t.find(x => x.key === 'athletic')).toMatchObject({ runs: 2, pct: 50 });
  });
  it('builds só incluem conjuntos idênticos repetidos, independente da ordem', () => {
    const rows = [
      row({ traits: 'base:a,base:b' }),
      row({ traits: 'base:b,base:a' }),
      row({ traits: 'base:a' }),
    ];
    const builds = computeTraitBuilds(rows);
    expect(builds).toHaveLength(1);
    expect(builds[0]).toMatchObject({ traits: ['a', 'b'], runs: 2 });
  });
});

describe('skills', () => {
  it('parse de nomes PT e IDs em inglês', () => {
    const m = parseSkills('Machado 10, Woodwork 4, Força 0');
    expect(m.get('Machado')).toBe(10);
    expect(m.get('Marcenaria')).toBe(4);
    expect(m.get('Força')).toBe(0);
  });
  it('média, máximo, quantidade e % no nível 10, nível 0 e distribuição', () => {
    const rows = [
      row({ skills: 'Machado 10, Força 2' }),
      row({ skills: 'Machado 6, Força 0' }),
      row({ skills: 'Machado 10' }),          // Força ausente = 0
      row({ skills: 'Machado 0, Força 4' }),
    ];
    const skills = computeSkills(rows);
    const machado = skills.find(s => s.name === 'Machado')!;
    expect(machado.avg).toBeCloseTo(6.5);
    expect(machado.max).toBe(10);
    expect(machado.count10).toBe(2);
    expect(machado.pct10).toBeCloseTo(50);
    expect(machado.count0).toBe(1);
    expect(machado.dist[10]).toBe(2);
    expect(machado.dist.reduce((a, b) => a + b, 0)).toBe(4);
    const forca = skills.find(s => s.name === 'Força')!;
    expect(forca.count0).toBe(2);
    expect(forca.avg).toBeCloseTo(1.5);
  });
  it('sempre lista todas as skills conhecidas, mesmo sem dados', () => {
    expect(computeSkills([row()]).length).toBeGreaterThanOrEqual(35);
  });
});

describe('sobrevivência', () => {
  it('média, mediana, extremos e distribuição', () => {
    const rows = [
      row({ days: 1,   is_alive: false }),
      row({ days: 5,   is_alive: false }),
      row({ days: 20,  is_alive: true }),
      row({ days: 400, is_alive: true }),
    ];
    const s = computeSurvival(rows);
    expect(s.avg_days).toBeCloseTo(106.5);
    expect(s.median_days).toBe(12.5);
    expect(s.max_days).toBe(400);
    expect(s.min_days).toBe(1);
    expect(s.avg_dead).toBe(3);
    expect(s.avg_alive).toBe(210);
    expect(s.buckets.map(b => b.count)).toEqual([2, 1, 0, 0, 0, 1]);
    expect(s.longest?.value).toBe(400);
  });
  it('mediana de lista ímpar/vazia', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([])).toBe(0);
  });
});

describe('filtros', () => {
  const rows = [
    row({ is_alive: true,  profession: 'Bombeiro', kills: 10 }),
    row({ is_alive: false, profession: 'Firefighter', kills: 20 }),
    row({ is_alive: false, profession: 'Veterano', kills: 30 }),
    row({ is_alive: true,  profession: 'Veterano', kills: 40, sandbox_ok: false }),
  ];

  it('desclassificados ficam fora por padrão e entram com includeDisqualified', () => {
    expect(applyFilters(rows, ALL)).toHaveLength(3);
    expect(applyFilters(rows, { ...ALL, includeDisqualified: true })).toHaveLength(4);
  });

  it('status e profissão alteram TODAS as seções de forma consistente', () => {
    const dead = computeChampionshipStats(rows, { ...ALL, status: 'dead' });
    expect(dead.overview).toMatchObject({ runs: 2, alive: 0, dead: 2, total_kills: 50 });
    expect(dead.zombies.total).toBe(50);
    expect(dead.professions.reduce((s, p) => s + p.runs, 0)).toBe(2);
    expect(dead.survival.buckets.reduce((s, b) => s + b.count, 0)).toBe(2);

    const bomb = computeChampionshipStats(rows, { ...ALL, profession: 'Bombeiro' });
    expect(bomb.overview.runs).toBe(2);          // Bombeiro + Firefighter
    expect(bomb.zombies.total).toBe(30);
    // opções de profissão não encolhem ao filtrar por profissão
    expect(bomb.profession_options).toEqual(expect.arrayContaining(['Bombeiro', 'Veterano']));
  });
});

describe('ações dos sobreviventes', () => {
  const synced = '2026-09-25T00:00:00Z';
  const rows = [
    row({ stats_synced_at: synced, houses_looted: 10, cities_visited: 3 }),
    row({ stats_synced_at: synced, houses_looted: 30, cities_visited: 5 }),
    row({ stats_synced_at: synced, houses_looted: 0,  cities_visited: 1 }),
    // contadores congelados (sem stats_synced_at) — NÃO podem entrar
    row({ stats_synced_at: null, houses_looted: 99999, cities_visited: 12 }),
  ];
  const find = (key: string) => computeActions(rows).groups.flatMap(g => g.actions).find(a => a.key === key)!;

  it('só usa runs com contadores confiáveis', () => {
    const a = computeActions(rows);
    expect(a.runs_with_data).toBe(3);
    expect(a.runs_total).toBe(4);
    const houses = find('houses_looted');
    expect(houses.total).toBe(40);
    expect(houses.max).toBe(30);
    expect(houses.avg).toBeCloseTo(40 / 3);
    expect(houses.median).toBe(10);
    expect(houses.runs_done).toBe(2);
    expect(houses.buckets.reduce((s, b) => s + b.count, 0)).toBe(3);
  });

  it('ações do tipo "peak" não têm total (somar cidades entre runs não significa nada)', () => {
    expect(find('cities_visited').total).toBeNull();
    expect(find('cities_visited').max).toBe(5);
  });

  it('ranking e recordes de ação ignoram contadores congelados', () => {
    expect(computeRanking(rows, 'action:houses_looted').map(r => r.value)).toEqual([30, 10]);
    const rec = computeRecords(rows).find(r => r.metric === 'action:houses_looted');
    expect(rec?.holder.value).toBe(30);
    expect(computeOverview(rows)).toMatchObject({ action_runs: 3, houses_looted: 40 });
  });

  it('valida métricas de ação', () => {
    expect(isRankingMetric('action:houses_looted')).toBe(true);
    expect(isRankingMetric('action:password_hash')).toBe(false);
  });

  it('todas as 33 ações estão registradas exatamente uma vez', () => {
    expect(ACTION_KEYS).toHaveLength(33);
    expect(new Set(ACTION_KEYS).size).toBe(33);
  });
});

describe('visão geral, rankings e recordes', () => {
  it('conta bases oficiais concluídas nos objectives (JSON string ou objeto)', () => {
    const rows = [
      row({ objectives: { bases: { rosewood: { has_base: true }, riverside: { has_base: false } } } }),
      row({ objectives: JSON.stringify({ bases: { muldraugh: { has_base: true }, fake_id: { has_base: true } } }) }),
    ];
    expect(computeOverview(rows).bases_built).toBe(2);
  });

  it('ranking ordena por valor, desempata por quem chegou primeiro e ignora zeros', () => {
    const a = row({ kills: 100, created_at: '2026-08-02T00:00:00Z' });
    const b = row({ kills: 100, created_at: '2026-08-01T00:00:00Z' });
    const c = row({ kills: 0 });
    const r = computeRanking([a, b, c], 'kills');
    expect(r.map(x => x.player_id)).toEqual([b.player_id, a.player_id]);
    expect(r[0]!.position).toBe(1);
  });

  it('aceita created_at como Date (pg-adapter) além de string (sqlite)', () => {
    const a = row({ kills: 50, created_at: new Date('2026-08-02T00:00:00Z') });
    const b = row({ kills: 50, created_at: new Date('2026-08-01T00:00:00Z') });
    expect(computeRanking([a, b], 'kills').map(x => x.player_id)).toEqual([b.player_id, a.player_id]);
    expect(computeChampionshipStats([a, b], ALL).records.find(r => r.metric === 'kills')?.holder?.player_id).toBe(b.player_id);
  });

  it('ranking por skill individual', () => {
    const rows = [row({ skills: 'Machado 3' }), row({ skills: 'Machado 9' })];
    expect(computeRanking(rows, 'skill:Machado').map(x => x.value)).toEqual([9, 3]);
  });

  it('valida métricas', () => {
    expect(isRankingMetric('kills')).toBe(true);
    expect(isRankingMetric('skill:Machado')).toBe(true);
    expect(isRankingMetric('skill:')).toBe(false);
    expect(isRankingMetric('password_hash')).toBe(false);
  });

  it('curiosidades ignoram grupos com menos de 5 runs', () => {
    const rows = [
      ...Array.from({ length: 5 }, () => row({ profession: 'Veterano', days: 10 })),
      row({ profession: 'Bombeiro', days: 999 }),
    ];
    const { curiosities } = computeChampionshipStats(rows, ALL);
    const longest = curiosities.find(c => c.kind === 'profession_longest');
    expect(longest).toMatchObject({ name: 'Veterano' });
  });
});

import { describe, it, expect } from 'vitest';
import { buildHistoryRow, isEmptyRun, isNewRunOf } from '../lib/runHistory';
import { planBackfill, type CurrentEntry, type DeathEvent } from '../lib/runHistoryBackfill';
import { computeChampionshipStats, computeRanking, type StatsRow } from '../lib/statistics';

describe('detecção de partida nova', () => {
  it('só considera nova run quando o tempo cai mais da metade', () => {
    expect(isNewRunOf(800_000, 52)).toBe(true);
    expect(isNewRunOf(800_000, 400_001)).toBe(false); // leitura ruim pontual não arquiva
    expect(isNewRunOf(100, 100)).toBe(false);
  });
});

describe('isEmptyRun (0 dias e 0 kills não vira histórico)', () => {
  it('só é vazia com os dois zerados', () => {
    expect(isEmptyRun(0, 0)).toBe(true);
    expect(isEmptyRun(null, undefined)).toBe(true);
    expect(isEmptyRun(0, 3)).toBe(false);   // morreu no dia 0, mas jogou
    expect(isEmptyRun(2, 0)).toBe(false);   // sobreviveu 2 dias sem matar
  });
});

describe('buildHistoryRow', () => {
  const base = {
    id: 65, player_id: 54, name: 'Kdevil', character_name: 'Kdevil', profession: 'Pedreiro',
    days: 563, kills: 47756, score: 31676, skills: 'Machado 10', traits: 'base:athletic',
    objectives: { military_base: true }, sandbox_ok: true, disqualification_reason: null,
    death_cause: 'zombie_horde', stats_synced_at: null, season_id: 2,
    houses_looted: 12, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-09-24T21:50:49Z',
    run_started_at: null,
  };

  it('run morta termina no último sync e começa no created_at quando não há run_started_at', () => {
    const row = buildHistoryRow({ ...base, is_alive: false }, 'sync', new Date('2026-09-24T22:10:00Z'));
    expect(row).toMatchObject({
      entry_id: 65, player_id: 54, days: 563, kills: 47756, death_cause: 'zombie_horde',
      season_id: 2, houses_looted: 12, source: 'sync', is_partial: false,
      run_started_at: '2026-08-01T00:00:00Z', run_ended_at: '2026-09-24T21:50:49Z',
    });
    expect(row).not.toHaveProperty('id');
    expect(row).not.toHaveProperty('created_at');
  });

  it('run abandonada viva termina no momento da troca', () => {
    const now = new Date('2026-09-24T22:10:00Z');
    const row = buildHistoryRow({ ...base, is_alive: true, run_started_at: '2026-09-01T00:00:00Z' }, 'manual', now);
    expect(row.run_ended_at).toBe(now.toISOString());
    expect(row.run_started_at).toBe('2026-09-01T00:00:00Z');
    expect(row.source).toBe('manual');
  });
});

describe('planBackfill', () => {
  const entry = (p: Partial<CurrentEntry>): CurrentEntry => ({
    id: 1, player_id: 10, character_name: 'Ana', days: 0, kills: 0, time_raw: 60, is_alive: true, deleted: false, ...p,
  });
  const death = (p: Partial<DeathEvent> & { data: DeathEvent['data'] }): DeathEvent => ({
    player_id: 10, char_name: 'Ana', created_at: '2026-09-10T00:00:00Z', ...p,
  });

  it('morte da run atual não vira run anterior; mortes antigas viram parciais', () => {
    const plan = planBackfill({
      entries: [entry({ days: 5, kills: 50, is_alive: false })],
      journal: [
        death({ created_at: '2026-09-07T00:00:00Z', data: { days: 30, kills: 900, score: 1500, cause: 'zombie' } }),
        death({ created_at: '2026-09-10T00:00:00Z', data: { days: 5, kills: 50, score: 100, cause: 'fall' } }),
      ],
      existing: [], sources: [],
    });
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ source: 'journal', is_partial: true });
    expect(plan[0]!.row).toMatchObject({ days: 30, kills: 900, death_cause: 'zombie', entry_id: 1 });
  });

  it('snapshot completo + estado final da morte pelo jornal (caso Kdevil)', () => {
    const plan = planBackfill({
      entries: [entry({ id: 65, player_id: 54, character_name: 'Kdevil', time_raw: 52, is_alive: true })],
      journal: [death({ player_id: 54, char_name: 'Kdevil', created_at: '2026-09-24T21:50:49Z',
        data: { days: 563, kills: 47756, score: 31676, cause: 'zombie_horde' } })],
      existing: [],
      sources: [{ name: 'snapshot', takenAt: '2026-09-24T18:00:00Z', rows: [{
        id: 65, player_id: 54, character_name: 'Kdevil', name: 'Kdevil', profession: 'Pedreiro',
        time_raw: 799741, days: 555, kills: 47332, score: 31533, skills: 'Machado 10', traits: 'base:athletic',
        is_alive: true, sandbox_ok: true, updated_at: '2026-09-24T19:22:27Z',
      }] }],
    });
    expect(plan).toHaveLength(1);                     // evento de morte consumido, sem duplicar
    expect(plan[0]).toMatchObject({ source: 'snapshot', is_partial: false });
    expect(plan[0]!.row).toMatchObject({
      profession: 'Pedreiro', skills: 'Machado 10',       // do snapshot
      days: 563, kills: 47756, score: 31676, death_cause: 'zombie_horde', is_alive: false, // do jornal
      run_ended_at: '2026-09-24T21:50:49Z',
    });
  });

  it('dump antigo da MESMA run já coberta pelo snapshot não vira run duplicada (caso Kdevil)', () => {
    const plan = planBackfill({
      entries: [entry({ id: 65, player_id: 54, character_name: 'Kdevil', time_raw: 52 })],
      journal: [death({ player_id: 54, char_name: 'Kdevil', created_at: '2026-09-24T21:50:49Z', data: { days: 563, kills: 47756 } })],
      existing: [],
      sources: [
        { name: 'snapshot', takenAt: '2026-09-24T20:53:34Z', rows: [{ id: 65, player_id: 54, character_name: 'Kdevil', time_raw: 799741, days: 555, kills: 47332 }] },
        { name: 'dump',     takenAt: '2026-09-03T17:49:00Z', rows: [{ id: '65', player_id: '54', character_name: 'Kdevil', time_raw: '345600', days: '240', kills: '11543' }] },
      ],
    });
    expect(plan).toHaveLength(1);
    expect(plan[0]!.source).toBe('snapshot');
  });

  it('dump antigo com morte registrada antes do snapshot É outra run', () => {
    const plan = planBackfill({
      entries: [entry({ time_raw: 52 })],
      journal: [death({ created_at: '2026-09-10T00:00:00Z', data: { days: 250, kills: 12000 } })],
      existing: [],
      sources: [
        { name: 'snapshot', takenAt: '2026-09-24T20:00:00Z', rows: [{ id: 1, player_id: 10, character_name: 'Ana', time_raw: 500000, days: 347, kills: 30000 }] },
        { name: 'dump',     takenAt: '2026-09-03T17:49:00Z', rows: [{ id: '1', player_id: '10', character_name: 'Ana', time_raw: '345600', days: '240', kills: '11543' }] },
      ],
    });
    expect(plan.map(p => p.source).sort()).toEqual(['dump', 'snapshot']);
    expect(plan.find(p => p.source === 'dump')!.row).toMatchObject({ days: 250, kills: 12000 }); // final pelo jornal
  });

  it('não recupera se a run do snapshot/dump ainda é a atual', () => {
    const plan = planBackfill({
      entries: [entry({ time_raw: 5000 })],
      journal: [], existing: [],
      sources: [{ name: 'dump', takenAt: '2026-09-03T17:49:00Z', rows: [{ id: 1, player_id: '10', character_name: 'Ana', time_raw: '4000', days: '2', kills: '9' }] }],
    });
    expect(plan).toHaveLength(0);
  });

  it('não ressuscita runs de entries removidas por moderador', () => {
    const plan = planBackfill({
      entries: [entry({ deleted: true, time_raw: 10 })],
      journal: [death({ data: { days: 30, kills: 900 } })],
      existing: [],
      sources: [{ name: 'dump', takenAt: '2026-09-03T17:49:00Z', rows: [{ id: 1, player_id: '10', character_name: 'Ana', time_raw: '40000', days: '27', kills: '800' }] }],
    });
    expect(plan).toHaveLength(0);
  });

  it('não duplica runs que o sync já arquivou', () => {
    const plan = planBackfill({
      entries: [entry({ time_raw: 10 })],
      journal: [death({ data: { days: 30, kills: 900 } })],
      existing: [{ player_id: 10, character_name: 'Ana', days: 30, kills: 900 }],
      sources: [],
    });
    expect(plan).toHaveLength(0);
  });

  it('dump vem com valores em texto (COPY do Postgres)', () => {
    const plan = planBackfill({
      entries: [entry({ time_raw: 10 })],
      journal: [], existing: [],
      sources: [{ name: 'dump', takenAt: '2026-09-03T17:49:00Z', rows: [{
        id: '1', player_id: '10', character_name: 'Ana', time_raw: '43200', days: '30', kills: '900',
        is_alive: 'f', sandbox_ok: 't', objectives: '{"military_base":true}', created_at: '2026-08-01',
      }] }],
    });
    expect(plan).toHaveLength(1);
    expect(plan[0]!.row).toMatchObject({ is_alive: false, sandbox_ok: true, objectives: { military_base: true } });
  });
});

describe('estatísticas com runs anteriores', () => {
  let n = 0;
  const row = (p: Partial<StatsRow>): StatsRow => ({
    id: ++n, player_id: n, name: 'P', character_name: 'C', profession: 'Pedreiro', days: 1, kills: 1,
    score: 0, skills: 'Machado 5', traits: 'base:athletic', objectives: null, is_alive: true,
    sandbox_ok: true, created_at: '2026-09-01T00:00:00Z', ...p,
  });
  const ALL = { status: 'all' as const, profession: null, includeDisqualified: false };

  it('runs anteriores contam em runs/mortes/kills; parciais ficam fora de profissões/traits/skills', () => {
    const rows = [
      row({ kills: 10 }),
      row({ is_alive: false, previous_run: true, kills: 100, days: 50 }),
      row({ is_alive: false, previous_run: true, partial: true, profession: null, skills: null, traits: null, kills: 1000, days: 300 }),
    ];
    const s = computeChampionshipStats(rows, ALL);
    expect(s.overview).toMatchObject({ runs: 3, previous_runs: 2, dead: 2, total_kills: 1110 });
    expect(s.professions.reduce((a, p) => a + p.runs, 0)).toBe(2);
    expect(s.professions.find(p => p.name === 'Desconhecida')).toBeUndefined();
    expect(s.skills.find(x => x.name === 'Machado')!.avg).toBe(5);
    expect(s.survival.max_days).toBe(300);
    expect(computeRanking(rows, 'kills')[0]).toMatchObject({ value: 1000, previous_run: true });
  });
});

import { describe, it, expect } from 'vitest';
import { favoriteCategory, parseWeaponStats, readWeaponKills } from '../lib/weapons';
import { computeWeapons, type StatsRow } from '../lib/statistics';

describe('parseWeaponStats', () => {
  it('lê wk_/wt: válidos e ignora o resto', () => {
    const w = parseWeaponStats({
      trees_cut: 3, wk_axe: 120, wk_firearm: 4, wk_bogus: 9, wk_other: 2, wk_spear: -1,
      'wt:Base.Axe': 100, 'wt:Base.HandAxe': 20, 'wt:../etc': 5, 'wt:Base.Pistol': 4,
    });
    expect(w).toEqual({ cats: { axe: 120, firearm: 4, other: 2 }, top: [['Base.Axe', 100], ['Base.HandAxe', 20], ['Base.Pistol', 4]] });
  });
  it('mod antigo (sem chaves de arma) = null', () => {
    expect(parseWeaponStats({ trees_cut: 3 })).toBeNull();
  });
});

describe('favoriteCategory', () => {
  it('maior tipo, ignorando "other"', () => {
    expect(favoriteCategory({ cats: { other: 500, spear: 30, axe: 10 }, top: [] })).toBe('spear');
    expect(favoriteCategory({ cats: { other: 5 }, top: [] })).toBeNull();
  });
});

describe('computeWeapons', () => {
  const row = (days: number, w: unknown): StatsRow => ({
    id: Math.random(), player_id: 1, name: 'x', character_name: 'c', profession: null, days, kills: 10,
    score: 0, skills: null, traits: null, objectives: null, is_alive: true, sandbox_ok: true,
    created_at: '2026-09-26', weapon_kills: w,
  } as StatsRow);
  it('soma tipos e armas, preferida por run; runs sem dado ficam de fora', () => {
    const rows = [
      row(10, JSON.stringify({ cats: { axe: 30, blunt: 10 }, top: [['Base.Axe', 30], ['Base.Bat', 10]] })),
      row(30, JSON.stringify({ cats: { axe: 50 }, top: [['Base.Axe', 50]] })),
      row(5,  JSON.stringify({ cats: { spear: 10 }, top: [['Base.SpearCrafted', 10]] })),
      row(99, null),
      row(99, 'lixo'),
    ];
    const r = computeWeapons(rows);
    expect(r.runs_with_data).toBe(3);
    expect(r.runs_total).toBe(5);
    expect(r.total_kills).toBe(100);
    expect(r.categories[0]).toEqual({ cat: 'axe', kills: 80, pct: 80 });
    expect(r.top_weapons[0]).toEqual({ id: 'Base.Axe', kills: 80, runs: 2 });
    expect(r.favorites[0]).toMatchObject({ cat: 'axe', runs: 2, avg_days: 20 });
  });
  it('readWeaponKills tolera lixo', () => {
    expect(readWeaponKills('{')).toBeNull();
    expect(readWeaponKills({ cats: { axe: 'x', spear: 2 }, top: [['bad id', 1]] })).toEqual({ cats: { spear: 2 }, top: [] });
  });
});

describe('computeStartPlaces', () => {
  it('agrupa por região de nascimento; média de dias só das mortas separada', async () => {
    const { computeStartPlaces } = await import('../lib/statistics');
    const r = (days: number, alive: boolean, start: string | null) => ({
      id: Math.random(), player_id: 1, name: 'x', character_name: 'c', profession: null, days, kills: 10,
      score: 0, skills: null, traits: null, objectives: null, is_alive: alive, sandbox_ok: true,
      created_at: '2026-09-26', start_region: start,
    } as unknown as StatsRow);
    const out = computeStartPlaces([r(10, false, 'Muldraugh'), r(30, true, 'Muldraugh'), r(5, false, 'Rosewood'), r(99, true, null)]);
    expect(out.tracked).toBe(3);
    expect(out.regions[0]).toMatchObject({ id: 'Muldraugh', runs: 2, dead: 1, avg_days: 20, avg_days_dead: 10 });
    expect(out.regions[1]).toMatchObject({ id: 'Rosewood', runs: 1, avg_days_dead: 5 });
  });
});

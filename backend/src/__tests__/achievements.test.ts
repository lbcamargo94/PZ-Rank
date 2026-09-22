/**
 * Testes de evaluateAchievements (backend/src/lib/achievements.ts)
 *
 * Cobre a correção da Fase 2 da auditoria de conquistas: o insert em lote
 * antigo abortava o lote inteiro quando QUALQUER linha colidia com o
 * UNIQUE(player_id, character_name, achievement_id) — deixando outras
 * conquistas novas e legítimas do MESMO lote nunca serem gravadas. A troca
 * para upsert com onConflict torna cada linha independente.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted garante que fromMock exista quando vi.mock for executado (ambos são hoistados)
const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock('../supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

import { evaluateAchievements } from '../lib/achievements';
import type { ExtendedStats } from '../lib/achievements';
import { SKILL_NAMES } from '../lib/skills';
import { OFFICIAL_BASE_IDS } from '../lib/scoring';
import type { Objectives, BaseObjectives } from '../types';

const ALL_SKILL_IDS = Object.keys(SKILL_NAMES).map(id => id.toLowerCase());

const FULL_BASE: BaseObjectives = {
  has_base: true, bed: true, windows: true, sink: true,
  power: true, food: true, vehicle: true, arsenal: true,
};

function fullyEquippedObjectives(): Objectives {
  const bases: Record<string, BaseObjectives> = {};
  for (const id of OFFICIAL_BASE_IDS) bases[id] = { ...FULL_BASE };
  return { bases, military_base: true, spiffo_hq: true, spiffo_relic: true };
}

function baseStats(overrides: Partial<ExtendedStats> = {}): ExtendedStats {
  return {
    kills: 0, days: 0, animalsKilled: 0, fishCaught: 0, cropsHarvested: 0,
    itemsCrafted: 0, housesLooted: 0, hoursWithoutSleep: 0, treesCut: 0,
    booksRead: 0, structuresBuilt: 0, cropsPlanted: 0, spiffoVisited: 0,
    eggsCollected: 0, milkProduced: 0, stoneStructures: 0, ceramicItems: 0,
    forgedWeapons: 0, kmDriven: 0, citiesVisited: 0, militaryVisited: 0,
    mealsCooked: 0, waterCollected: 0, materialsCrafted: 0, animalTracks: 0,
    weaponsCrafted: 0, furnitureCrafted: 0, clothesCrafted: 0, cheeseProduced: 0,
    doorsOpened: 0, sleepLocations: 0, basementsExplored: 0, stationsUsed: 0,
    animalSpecies: 0, daysNoCanned: 0, skillLevels: {},
    ...overrides,
  };
}

// Chain fake: select()/eq() retornam o mesmo objeto (thenable); upsert() retorna
// diretamente uma Promise (nada encadeia depois dele no código real).
function makeSelectChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq:     vi.fn(() => chain),
    then:   (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

describe('evaluateAchievements', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('usa upsert (não insert) com onConflict player_id,character_name,achievement_id', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ data: [], error: null });

    fromMock
      .mockReturnValueOnce(makeSelectChain({
        data: [{ id: 1, stat: 'kills', threshold: 100 }],
        error: null,
      }))
      .mockReturnValueOnce(makeSelectChain({ data: [], error: null })) // nada desbloqueado ainda
      .mockReturnValueOnce({ upsert: upsertMock });

    await evaluateAchievements(1, 'Bob', 42, baseStats({ kills: 150 }));

    expect(upsertMock).toHaveBeenCalledTimes(1);
    const [rows, opts] = upsertMock.mock.calls[0]!;
    expect(opts).toEqual({ onConflict: 'player_id,character_name,achievement_id' });
    expect(rows).toEqual([
      expect.objectContaining({ player_id: 1, character_name: 'Bob', achievement_id: 1, entry_id: 42 }),
    ]);
  });

  it('não lança exceção e loga quando o upsert retorna erro (ex: colisão de lote)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const upsertMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'conflito simulado' } });

    fromMock
      .mockReturnValueOnce(makeSelectChain({
        data: [{ id: 1, stat: 'kills', threshold: 100 }],
        error: null,
      }))
      .mockReturnValueOnce(makeSelectChain({ data: [], error: null }))
      .mockReturnValueOnce({ upsert: upsertMock });

    await expect(evaluateAchievements(1, 'Bob', 42, baseStats({ kills: 150 }))).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('não chama upsert quando nenhuma conquista nova foi atingida', async () => {
    fromMock
      .mockReturnValueOnce(makeSelectChain({
        data: [{ id: 1, stat: 'kills', threshold: 100 }],
        error: null,
      }))
      .mockReturnValueOnce(makeSelectChain({ data: [{ achievement_id: 1 }], error: null })); // já desbloqueada

    await evaluateAchievements(1, 'Bob', 42, baseStats({ kills: 150 }));

    expect(fromMock).toHaveBeenCalledTimes(2); // só os 2 selects, sem 3ª chamada de upsert
  });

  it('inclui no lote TODAS as conquistas recém-atingidas em uma única chamada de upsert (regressão do bug de lote parcial)', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ data: [], error: null });

    fromMock
      .mockReturnValueOnce(makeSelectChain({
        data: [
          { id: 1, stat: 'kills', threshold: 100 },
          { id: 2, stat: 'days', threshold: 10 },
          { id: 3, stat: 'kills', threshold: 1000 },
        ],
        error: null,
      }))
      .mockReturnValueOnce(makeSelectChain({ data: [], error: null }))
      .mockReturnValueOnce({ upsert: upsertMock });

    // Atinge as conquistas 1 e 2, mas não a 3 (kills < 1000)
    await evaluateAchievements(1, 'Bob', 42, baseStats({ kills: 150, days: 12 }));

    const [rows] = upsertMock.mock.calls[0]!;
    const ids = (rows as Array<{ achievement_id: number }>).map(r => r.achievement_id).sort();
    // Antes da correção, um insert em lote simples já entregava as 2 linhas corretas
    // aqui (o bug só se manifesta quando uma delas JÁ existe no banco — coberto pelo
    // fato de que agora usamos upsert, testado nas asserções acima). Este teste prova
    // que o lote inteiro (não só a primeira) é enviado numa única chamada.
    expect(ids).toEqual([1, 2]);
  });
});

describe('evaluateAchievements — conquistas derivadas (auditoria, Fase 1 Grupo A/B)', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  async function runFor(stat: string, threshold: number, stats: Parameters<typeof evaluateAchievements>[3], objectives: Objectives | null = null) {
    // Reseta a cada chamada: alguns testes chamam runFor() 2x no mesmo `it` (ex:
    // valor abaixo vs no limite), e quando a conquista não é atingida o código
    // nem chega a fazer a 3ª chamada .from() (upsert) — sem o reset, esse mock
    // não-consumido vazava pra próxima chamada e embaralhava a fila.
    fromMock.mockReset();
    const upsertMock = vi.fn().mockResolvedValue({ data: [], error: null });
    fromMock
      .mockReturnValueOnce(makeSelectChain({ data: [{ id: 99, stat, threshold, tier: 'platinum' }], error: null }))
      .mockReturnValueOnce(makeSelectChain({ data: [], error: null }));
    fromMock.mockReturnValueOnce({ upsert: upsertMock });
    await evaluateAchievements(1, 'Bob', 42, stats, objectives);
    return upsertMock;
  }

  it('all_skills_10: bloqueada com 1 skill em nível 9, desbloqueada com todas em 10', async () => {
    const skillLevels9 = Object.fromEntries(ALL_SKILL_IDS.map((id, i) => [id, i === 0 ? 9 : 10]));
    const upsert9 = await runFor('all_skills_10', 1, baseStats({ skillLevels: skillLevels9 }));
    expect(upsert9).not.toHaveBeenCalled();

    const skillLevels10 = Object.fromEntries(ALL_SKILL_IDS.map(id => [id, 10]));
    const upsert10 = await runFor('all_skills_10', 1, baseStats({ skillLevels: skillLevels10 }));
    expect(upsert10).toHaveBeenCalledTimes(1);
  });

  it('all_cities_visited: 11 bloqueada, 12 (meta definida com o usuário) desbloqueada', async () => {
    const u11 = await runFor('all_cities_visited', 1, baseStats({ citiesVisited: 11 }));
    expect(u11).not.toHaveBeenCalled();
    const u12 = await runFor('all_cities_visited', 1, baseStats({ citiesVisited: 12 }));
    expect(u12).toHaveBeenCalledTimes(1);
  });

  it('all_animal_species: 6 bloqueada, 7 (meta definida com o usuário) desbloqueada', async () => {
    const u6 = await runFor('all_animal_species', 1, baseStats({ animalSpecies: 6 }));
    expect(u6).not.toHaveBeenCalled();
    const u7 = await runFor('all_animal_species', 1, baseStats({ animalSpecies: 7 }));
    expect(u7).toHaveBeenCalledTimes(1);
  });

  it('bases_built: conta apenas bases oficiais com has_base=true', async () => {
    const bases: Record<string, BaseObjectives> = {};
    const ids = [...OFFICIAL_BASE_IDS];
    bases[ids[0]!] = { ...FULL_BASE };
    bases[ids[1]!] = { ...FULL_BASE };
    bases[ids[2]!] = { ...FULL_BASE, has_base: false }; // não conta
    bases['nao_oficial'] = { ...FULL_BASE }; // ignorado (fora de OFFICIAL_BASE_IDS)
    const objectives: Objectives = { bases, military_base: false, spiffo_hq: false, spiffo_relic: false };

    const u1 = await runFor('bases_built', 3, baseStats(), objectives);
    expect(u1).not.toHaveBeenCalled(); // só 2 bases oficiais construídas, meta é 3

    const u2 = await runFor('bases_built', 2, baseStats(), objectives);
    expect(u2).toHaveBeenCalledTimes(1);
  });

  it('all_bases_equipped: uma base com equipamento faltando bloqueia; todas completas desbloqueia', async () => {
    const complete = fullyEquippedObjectives();
    const incomplete = fullyEquippedObjectives();
    const firstId = [...OFFICIAL_BASE_IDS][0]!;
    incomplete.bases[firstId] = { ...incomplete.bases[firstId]!, arsenal: false };

    const uIncomplete = await runFor('all_bases_equipped', 1, baseStats(), incomplete);
    expect(uIncomplete).not.toHaveBeenCalled();

    const uComplete = await runFor('all_bases_equipped', 1, baseStats(), complete);
    expect(uComplete).toHaveBeenCalledTimes(1);
  });

  it('military_cleared: reflete objectives.military_base diretamente', async () => {
    const uFalse = await runFor('military_cleared', 1, baseStats(), { bases: {}, military_base: false, spiffo_hq: false, spiffo_relic: false });
    expect(uFalse).not.toHaveBeenCalled();
    const uTrue = await runFor('military_cleared', 1, baseStats(), { bases: {}, military_base: true, spiffo_hq: false, spiffo_relic: false });
    expect(uTrue).toHaveBeenCalledTimes(1);
  });

  it('all_objectives_complete: exige bases equipadas + militar + spiffo_hq + spiffo_relic simultaneamente', async () => {
    const almostThere = fullyEquippedObjectives();
    almostThere.spiffo_relic = false; // falta só isso

    const uAlmost = await runFor('all_objectives_complete', 1, baseStats(), almostThere);
    expect(uAlmost).not.toHaveBeenCalled();

    const uComplete = await runFor('all_objectives_complete', 1, baseStats(), fullyEquippedObjectives());
    expect(uComplete).toHaveBeenCalledTimes(1);
  });

  it('all_gold_achievements: só desbloqueia quando TODAS as conquistas de tier ouro já existentes já foram desbloqueadas', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ data: [], error: null });

    // Cenário 1: existem 2 conquistas ouro, jogador só tem 1 desbloqueada
    fromMock
      .mockReturnValueOnce(makeSelectChain({
        data: [
          { id: 1, stat: 'kills', threshold: 100, tier: 'gold' },
          { id: 2, stat: 'days', threshold: 10, tier: 'gold' },
          { id: 3, stat: 'all_gold_achievements', threshold: 1, tier: 'legendary' },
        ],
        error: null,
      }))
      .mockReturnValueOnce(makeSelectChain({ data: [{ achievement_id: 1 }], error: null }));
    fromMock.mockReturnValueOnce({ upsert: upsertMock });

    await evaluateAchievements(1, 'Bob', 42, baseStats({ kills: 0, days: 0 })); // não atinge 1 nem 2 de novo, só checa a meta-conquista
    expect(upsertMock).not.toHaveBeenCalled();

    // Cenário 2: jogador já tem as 2 conquistas ouro desbloqueadas
    // (reset: cenário 1 não chegou a fazer a 3ª chamada .from(), deixando o
    // mock de upsert acima não-consumido na fila — mesma causa corrigida em runFor)
    fromMock.mockReset();
    const upsertMock2 = vi.fn().mockResolvedValue({ data: [], error: null });
    fromMock
      .mockReturnValueOnce(makeSelectChain({
        data: [
          { id: 1, stat: 'kills', threshold: 100, tier: 'gold' },
          { id: 2, stat: 'days', threshold: 10, tier: 'gold' },
          { id: 3, stat: 'all_gold_achievements', threshold: 1, tier: 'legendary' },
        ],
        error: null,
      }))
      .mockReturnValueOnce(makeSelectChain({ data: [{ achievement_id: 1 }, { achievement_id: 2 }], error: null }));
    fromMock.mockReturnValueOnce({ upsert: upsertMock2 });

    await evaluateAchievements(1, 'Bob', 42, baseStats());
    expect(upsertMock2).toHaveBeenCalledTimes(1);
    const [rows] = upsertMock2.mock.calls[0]!;
    expect(rows).toEqual([expect.objectContaining({ achievement_id: 3 })]);
  });

  // Regressão do bug encontrado na auditoria: essas 3 usavam s.spiffoVisited
  // (contagem de visitas) em vez de contagem real de bases. Aqui o jogador visitou
  // 12 restaurantes (spiffoVisited alto) mas não tem NENHUMA base construída —
  // com o bug antigo, as 3 desbloqueariam; com a correção, nenhuma deve desbloquear.
  it('spiffo_base_any/five/all: NÃO desbloqueiam só com visitas, exigem base real (objectives.bases)', async () => {
    const visitedButNoBase = baseStats({ spiffoVisited: 12 });
    const noBasesObjectives: Objectives = { bases: {}, military_base: false, spiffo_hq: false, spiffo_relic: false };

    const uAny  = await runFor('spiffo_base_any',  1, visitedButNoBase, noBasesObjectives);
    expect(uAny).not.toHaveBeenCalled();
    const uFive = await runFor('spiffo_base_five', 5, visitedButNoBase, noBasesObjectives);
    expect(uFive).not.toHaveBeenCalled();
    const uAll  = await runFor('all_spiffo_bases',  1, visitedButNoBase, noBasesObjectives);
    expect(uAll).not.toHaveBeenCalled();
  });

  it('spiffo_base_any: desbloqueia com 1 base real, mesmo sem nenhuma visita registrada', async () => {
    const oneBase: Objectives = {
      bases: { [[...OFFICIAL_BASE_IDS][0]!]: { ...FULL_BASE } },
      military_base: false, spiffo_hq: false, spiffo_relic: false,
    };
    const u = await runFor('spiffo_base_any', 1, baseStats({ spiffoVisited: 0 }), oneBase);
    expect(u).toHaveBeenCalledTimes(1);
  });

  it('all_spiffo_bases: exige as 12 bases oficiais, não 13 (bug antigo comparava contra 13, um total que nunca existiu)', async () => {
    const bases: Record<string, BaseObjectives> = {};
    const ids = [...OFFICIAL_BASE_IDS];
    for (const id of ids.slice(0, 11)) bases[id] = { ...FULL_BASE }; // 11 de 12
    const almostAll: Objectives = { bases, military_base: false, spiffo_hq: false, spiffo_relic: false };

    const u11 = await runFor('all_spiffo_bases', 1, baseStats(), almostAll);
    expect(u11).not.toHaveBeenCalled();

    for (const id of ids) bases[id] = { ...FULL_BASE }; // as 12
    const u12 = await runFor('all_spiffo_bases', 1, baseStats(), almostAll);
    expect(u12).toHaveBeenCalledTimes(1);
  });
});

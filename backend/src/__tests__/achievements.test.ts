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

function baseStats(overrides: Partial<Record<string, number>> = {}) {
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

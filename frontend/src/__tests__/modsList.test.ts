import { describe, it, expect } from 'vitest';
import type { Mod } from '../types';
import { groupMods, matchesQuery, sortGroups, nameSortKey, workshopIdFrom, isNewGroup } from '../lib/modsList';

let nextId = 1;
function mod(p: Partial<Mod>): Mod {
  const id = nextId++;
  return {
    id, name: `Mod ${id}`, mod_id: `MOD_${id}`, workshop_id: null,
    workshop_url: `https://steamcommunity.com/sharedfiles/filedetails/?id=${900000 + id}`,
    status: 'active', is_required: false, image_url: null, block_reason: null,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', dependencies: [],
    ...p,
  };
}

describe('workshopIdFrom', () => {
  it('lê link com ?id=, link sem ?id= e número sozinho', () => {
    expect(workshopIdFrom('https://steamcommunity.com/sharedfiles/filedetails/?id=3618123324')).toBe('3618123324');
    expect(workshopIdFrom('steamcommunity.com/sharedfiles/filedetails/2710167561')).toBe('2710167561');
    expect(workshopIdFrom(' 3618123324 ')).toBe('3618123324');
  });
  it('não confunde texto ou número curto com item da Oficina', () => {
    expect(workshopIdFrom('EURY_CRAFTING')).toBeNull();
    expect(workshopIdFrom('42')).toBeNull();
  });
});

describe('groupMods', () => {
  it('junta IDs do mesmo item, mesmo quando falta workshop_id (usa o link)', () => {
    const groups = groupMods([
      mod({ name: 'TwisTonFire - Stats', mod_id: 'twistonfirestats',   workshop_id: '3480305133' }),
      mod({ name: 'TwisTonFire - Stats', mod_id: 'twistonfirestatsmp', workshop_id: null,
            workshop_url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3480305133' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].mods).toHaveLength(2);
    expect(groups[0].workshopId).toBe('3480305133');
  });
  it('classifica o item como permitido, bloqueado ou parcial', () => {
    const [a, b, c] = groupMods([
      mod({ workshop_id: '1000001' }),
      mod({ workshop_id: '1000002', status: 'blocked' }),
      mod({ workshop_id: '1000003' }), mod({ workshop_id: '1000003', status: 'blocked' }),
    ]);
    expect([a.status, b.status, c.status]).toEqual(['allowed', 'blocked', 'mixed']);
  });
  it('usa o cadastro mais antigo do item como data de entrada', () => {
    const [g] = groupMods([
      mod({ workshop_id: '1000004', created_at: '2026-11-10T00:00:00Z' }),
      mod({ workshop_id: '1000004', created_at: '2026-09-01T00:00:00Z' }),
    ]);
    expect(g.addedAt).toBe(Date.parse('2026-09-01T00:00:00Z'));
  });
});

describe('matchesQuery', () => {
  const [g] = groupMods([mod({ name: 'Better Crafting', mod_id: 'EURY_CRAFTING', workshop_id: '3618123324' })]);
  const [acc] = groupMods([mod({ name: 'Tradução PT-BR', mod_id: 'PTBRB42' })]);

  it('acha pelo nome, sem diferenciar maiúscula', () => {
    expect(matchesQuery(g, 'better craft')).toBe(true);
    expect(matchesQuery(g, 'CRAFTING')).toBe(true);
  });
  it('acha pelo ID do mod, inclusive digitado com espaço no lugar do "_"', () => {
    expect(matchesQuery(g, 'EURY_CRAFTING')).toBe(true);
    expect(matchesQuery(g, 'eury crafting')).toBe(true);
  });
  it('acha pelo link ou número da Oficina e só pelo item exato', () => {
    expect(matchesQuery(g, 'https://steamcommunity.com/sharedfiles/filedetails/?id=3618123324')).toBe(true);
    expect(matchesQuery(g, '3618123324')).toBe(true);
    expect(matchesQuery(g, '3618123325')).toBe(false);
  });
  it('ignora acentos', () => {
    expect(matchesQuery(acc, 'traducao')).toBe(true);
  });
  it('busca vazia mostra tudo; busca sem relação não mostra', () => {
    expect(matchesQuery(g, '   ')).toBe(true);
    expect(matchesQuery(g, 'mapa')).toBe(false);
  });
});

describe('nameSortKey e sortGroups', () => {
  it('ignora prefixos de versão no começo do nome', () => {
    expect(nameSortKey('[B42.20] Detailed Descriptions')).toBe('detailed descriptions');
    expect(nameSortKey('42.20 | Every Texture Optimized')).toBe('every texture optimized');
    expect(nameSortKey('(B42) Ánimo')).toBe('animo');
  });
  it('ordena de A a Z e por adicionados recentemente', () => {
    const groups = groupMods([
      mod({ name: 'Zed Fix',         created_at: '2026-11-12T00:00:00Z' }),
      mod({ name: '[B42] Alarm',      created_at: '2026-01-01T00:00:00Z' }),
      mod({ name: 'Map Legend',       created_at: '2026-06-01T00:00:00Z' }),
    ]);
    expect(sortGroups(groups, 'az').map(g => g.primary.name)).toEqual(['[B42] Alarm', 'Map Legend', 'Zed Fix']);
    expect(sortGroups(groups, 'recent').map(g => g.primary.name)).toEqual(['Zed Fix', 'Map Legend', '[B42] Alarm']);
    expect(groups.map(g => g.letter)).toEqual(['Z', 'A', 'M']);
  });
});

describe('isNewGroup', () => {
  it('marca como novo só o que entrou nos últimos 14 dias', () => {
    const now = Date.parse('2026-11-13T12:00:00Z');
    const [recent, old] = groupMods([
      mod({ created_at: '2026-11-05T00:00:00Z' }),
      mod({ created_at: '2026-10-01T00:00:00Z' }),
    ]);
    expect(isNewGroup(recent, now)).toBe(true);
    expect(isNewGroup(old, now)).toBe(false);
  });
});

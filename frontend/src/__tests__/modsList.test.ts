import { describe, it, expect } from 'vitest';
import type { Mod } from '../types';
import { groupMods, matchesQuery, sortGroups, nameSortKey, workshopIdFrom, isNewGroup, applyUsage, countByCategory, isStaleGroup, monthsSinceUpdate, fmtCount, parseModListText, checkModList, modListUrl, tabForExactModId } from '../lib/modsList';

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

describe('categorias, inscritos e uso (v4.34.0)', () => {
  it('junta as categorias dos IDs do item e descarta "outros" quando há categoria real', () => {
    const [g] = groupMods([
      mod({ workshop_id: '2000001', categories: ['outros'] }),
      mod({ workshop_id: '2000001', categories: ['mapas', 'interface'] }),
    ]);
    expect(g.categories).toEqual(['interface', 'mapas']);
    const [o] = groupMods([mod({ workshop_id: '2000002' })]);
    expect(o.categories).toEqual(['outros']);
  });
  it('conta itens por categoria (um item conta em cada categoria que tem)', () => {
    const groups = groupMods([
      mod({ workshop_id: '2000003', categories: ['interface', 'mapas'] }),
      mod({ workshop_id: '2000004', categories: ['interface'] }),
    ]);
    const c = countByCategory(groups);
    expect(c.get('interface')).toBe(2);
    expect(c.get('mapas')).toBe(1);
  });
  it('aplica o uso por item da Oficina, com fallback pelo mod_id, e ordena por mais usados', () => {
    const groups = groupMods([
      mod({ name: 'A', workshop_id: '2000005', mod_id: 'AAA' }),
      mod({ name: 'B', workshop_id: '2000006', mod_id: 'BBB' }),
      mod({ name: 'C', workshop_id: '2000007', mod_id: 'CCC' }),
    ]);
    const used = applyUsage(groups, {
      days: 14, participants: 40,
      items: [
        { workshop_id: '2000006', mod_ids: ['BBB'], players: 30 },
        { workshop_id: null,      mod_ids: ['CCC'], players: 5 },
      ],
    });
    expect(used.map(g => g.players)).toEqual([0, 30, 5]);
    expect(sortGroups(used, 'used').map(g => g.primary.name)).toEqual(['B', 'C', 'A']);
    expect(applyUsage(groups, null)[0].players).toBeNull();
  });
  it('marca como desatualizado o item sem atualização na Oficina há mais de 6 meses', () => {
    const now = Date.parse('2026-11-13T00:00:00Z');
    const [old, fresh, unknown] = groupMods([
      mod({ workshop_id: '2000008', steam_updated_at: '2026-03-01T00:00:00Z' }),
      mod({ workshop_id: '2000009', steam_updated_at: '2026-10-01T00:00:00Z' }),
      mod({ workshop_id: '2000010' }),
    ]);
    expect(isStaleGroup(old, now)).toBe(true);
    expect(monthsSinceUpdate(old, now)).toBe(8);
    expect(isStaleGroup(fresh, now)).toBe(false);
    expect(isStaleGroup(unknown, now)).toBe(false);
  });
  it('formata inscritos de forma curta', () => {
    expect(fmtCount(950)).toBe('950');
    expect(fmtCount(2100)).toBe('2,1 mil');
    expect(fmtCount(45_300)).toBe('45 mil');
    expect(fmtCount(1_250_000)).toBe('1,3 mi');
  });
});

describe('Conferir minha lista (v4.35.0)', () => {
  const groups = groupMods([
    mod({ name: 'PZ Community Rank', mod_id: 'PZCommunityRank', workshop_id: '3000001', is_required: true }),
    mod({ name: 'TwisTonFire - Stats', mod_id: 'twistonfirestats',         workshop_id: '3000002', is_required: true }),
    mod({ name: 'TwisTonFire - Stats', mod_id: 'twistonfirestatsmpstable', workshop_id: '3000002', is_required: true }),
    mod({ name: 'Better Crafting', mod_id: 'EURY_CRAFTING', workshop_id: '3000003' }),
    mod({ name: 'Helicopter', mod_id: 'Pz-Helicopter-Events-Spawn', workshop_id: '3000004', status: 'blocked' }),
    mod({ name: 'Neat', mod_id: 'Neat_Building_UIOnly', workshop_id: '3000005' }),
    mod({ name: 'Neat', mod_id: 'Neat_Building',        workshop_id: '3000005', status: 'blocked' }),
  ]);

  it('lê o mods.txt do save, sem a moldura e sem os IDs internos', () => {
    const txt = 'VERSION = 1,\n\nmods\n{\n    mod = \EURY_CRAFTING,\n    mod = base,\n    mod = Saint Hairstyles,\n}\n\nmaps\n{\n}\n';
    expect(parseModListText(txt)).toEqual(['EURY_CRAFTING', 'Saint Hairstyles']);
  });
  it('lê também uma lista de IDs por linha ou vírgula, sem repetir', () => {
    expect(parseModListText('A, B\nC;A\n\n')).toEqual(['A', 'B', 'C']);
  });
  it('classifica cada ID como o servidor: exato, bloqueado ou fora do cadastro', () => {
    const r = checkModList('PZCommunityRank\ntwistonfirestats\nEURY_CRAFTING\nPz-Helicopter-Events-Spawn\neury_crafting\nMeuModLocal', groups);
    expect(r.total).toBe(6);
    expect(r.allowed.map(h => h.id)).toEqual(['PZCommunityRank', 'twistonfirestats', 'EURY_CRAFTING']);
    expect(r.blocked.map(h => h.id)).toEqual(['Pz-Helicopter-Events-Spawn']);
    expect(r.unlisted).toEqual([
      { id: 'eury_crafting', suggestion: 'EURY_CRAFTING' },
      { id: 'MeuModLocal',   suggestion: null },
    ]);
  });
  it('item parcialmente permitido: o ID liberado passa, o bloqueado não', () => {
    const r = checkModList('Neat_Building_UIOnly\nNeat_Building', groups);
    expect(r.allowed.map(h => h.id)).toEqual(['Neat_Building_UIOnly']);
    expect(r.blocked.map(h => h.id)).toEqual(['Neat_Building']);
  });
  it('exige todos os IDs obrigatórios e aponta cada um que falta', () => {
    expect(checkModList('PZCommunityRank\ntwistonfirestats\ntwistonfirestatsmpstable', groups).requiredMissing).toEqual([]);
    expect(checkModList('PZCommunityRank\ntwistonfirestats', groups).requiredMissing
      .map(r => [r.group.primary.name, r.ids])).toEqual([['TwisTonFire - Stats', ['twistonfirestatsmpstable']]]);
    expect(checkModList('EURY_CRAFTING', groups).requiredMissing.map(r => r.group.primary.name))
      .toEqual(['PZ Community Rank', 'TwisTonFire - Stats']);
  });
  it('separa número da Oficina colado no lugar do ID', () => {
    const r = checkModList('3618123324\nEURY_CRAFTING', groups);
    expect(r.workshopNumbers).toEqual(['3618123324']);
    expect(r.total).toBe(1);
  });
  it('monta o link "Ver na lista" e acha a aba do ID exato', () => {
    expect(modListUrl('EURY_CRAFTING')).toBe('/mods-lista?q=EURY_CRAFTING');
    expect(modListUrl('Neat Building')).toBe('/mods-lista?q=Neat+Building');
    expect(tabForExactModId(groups, 'Neat_Building')).toBe('mixed');
    expect(tabForExactModId(groups, 'Pz-Helicopter-Events-Spawn')).toBe('blocked');
    expect(tabForExactModId(groups, 'EURY_CRAFTING')).toBe('allowed');
    expect(tabForExactModId(groups, 'eury')).toBeNull();
  });
});

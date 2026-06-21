/**
 * Testes do pipeline de traits — camada backend.
 *
 * Cobre:
 *  1. Decoder: extrai traits corretamente do campo 8 do código PZRX2
 *  2. Lógica de armazenamento do sync route (simulada, sem BD)
 *  3. Novo save (INSERT) e save em andamento (UPDATE)
 *  4. Sanidade do mapa SKILL_NAMES (IDs B42 corretos)
 */

import { describe, it, expect } from 'vitest';
import { parsePzrCode } from '../lib/decoder';
import { SKILL_NAMES } from '../lib/skills';

// ─── Helper: reproduz o obfuscate() do RankCode.lua ─────────────────────────

const XOR_KEY = 'PZRank-Community-2026-Key!';

function obfuscate(plain: string): string {
  const key  = Buffer.from(XOR_KEY, 'latin1');
  const data = Buffer.from(plain, 'latin1');
  const out  = Buffer.allocUnsafe(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i]! ^ key[i % key.length]!;
  return out.toString('base64');
}

interface MockEntry {
  charName?:  string;
  profession?: string;
  kills?:     number;
  time?:      number;
  skills?:    string;
  status?:    'vivo' | 'morto';
  sandbox?:   'ok' | 'invalido';
  traits?:    string;
}

function makeCode(e: MockEntry = {}): string {
  const plain = [
    'PZR',
    e.charName   ?? 'Joao Silva',
    e.profession ?? 'Segurança',
    e.kills      ?? 0,
    e.time       ?? 0,
    e.skills     ?? '',
    e.status     ?? 'vivo',
    e.sandbox    ?? 'ok',
    e.traits     ?? '',
  ].join('|');
  return 'PZRX2:' + obfuscate(plain);
}

/** Simula a linha de sync.ts que persiste traits no BD */
function toStoredTraits(decoded: { traits: string[] }): string | null {
  return decoded.traits.length > 0 ? decoded.traits.join(',') : null;
}

// ─── IDs de traits B42 conhecidos ───────────────────────────────────────────

const KNOWN_B42_TRAIT_IDS = [
  // Positivas
  'Athletic', 'Fit', 'Strong', 'Stout', 'Graceful', 'LightFooted',
  'NimbleFingers', 'Dextrous', 'ThickSkinned', 'Resilient', 'Wakeful',
  'VeryUnderweight', 'KeenHearing', 'EagleEyed', 'Brave', 'Organized',
  'Lucky', 'FastLearner', 'FastReader', 'Handy', 'Outdoorsman',
  'SpeedDemon', 'FirstAider', 'BornSurvivor', 'CatEyes', 'Marksman',
  'Hunter', 'Herbalist', 'Inconspicuous', 'IronGut', 'Desensitized',
  'Construction',
  // Negativas
  'Weak', 'Unfit', 'Obese', 'Overweight', 'OutOfShape', 'ThinSkinned',
  'SlowHealer', 'ProneToIllness', 'Smoker', 'Underweight',
  'HardOfHearing', 'ShortSighted', 'Deaf', 'Cowardly', 'Clumsy',
  'SlowReader', 'SlowLearner', 'Conspicuous', 'HeartyAppetite',
  'PanickedShot', 'Restless', 'Sleepyhead', 'Pacifist', 'Claustrophobic',
  'Agoraphobic', 'Hemophobic', 'Illiterate', 'BetaBlocker', 'Glasses',
];

// ─── 1. Decoder: extração do campo traits ────────────────────────────────────

describe('parsePzrCode — traits', () => {

  it('extrai traits do campo 8 (PZRX2)', () => {
    const r = parsePzrCode(makeCode({ traits: 'Athletic,Lucky,Smoker' }));
    expect(r).not.toBeNull();
    expect(r!.traits).toEqual(['Athletic', 'Lucky', 'Smoker']);
  });

  it('traits vazio → array vazio', () => {
    expect(parsePzrCode(makeCode({ traits: '' }))!.traits).toEqual([]);
  });

  it('trait única preservada', () => {
    expect(parsePzrCode(makeCode({ traits: 'Brave' }))!.traits).toEqual(['Brave']);
  });

  it('ordem das traits preservada', () => {
    const ids = ['Smoker', 'Athletic', 'Cowardly', 'FastLearner', 'Lucky'];
    expect(parsePzrCode(makeCode({ traits: ids.join(',') }))!.traits).toEqual(ids);
  });

  it('espaços em volta de cada ID são removidos', () => {
    expect(parsePzrCode(makeCode({ traits: 'Athletic, Lucky , Smoker' }))!.traits)
      .toEqual(['Athletic', 'Lucky', 'Smoker']);
  });

  it('não interfere com os outros campos decodificados', () => {
    const r = parsePzrCode(makeCode({
      charName: 'Ana Lima', profession: 'Policial',
      kills: 9999, time: 4320,
      skills: 'Sprinting 5,Axe 7', status: 'vivo',
      traits: 'Athletic,IronGut',
    }))!;
    expect(r.characterName).toBe('Ana Lima');
    expect(r.profession).toBe('Policial');
    expect(r.kills).toBe(9999);
    expect(r.days).toBe(3);           // 4320 min / 1440
    expect(r.isAlive).toBe(true);
    expect(r.sandboxOk).toBe(true);
    expect(r.traits).toEqual(['Athletic', 'IronGut']);
  });

  it('preserva todos os IDs B42 conhecidos numa submissão', () => {
    const csv = KNOWN_B42_TRAIT_IDS.join(',');
    const r   = parsePzrCode(makeCode({ traits: csv }))!;
    expect(r.traits).toHaveLength(KNOWN_B42_TRAIT_IDS.length);
    for (const id of KNOWN_B42_TRAIT_IDS) expect(r.traits).toContain(id);
  });

  it('status=morto não afeta a extração de traits', () => {
    const r = parsePzrCode(makeCode({ status: 'morto', traits: 'Brave,Cowardly' }))!;
    expect(r.isAlive).toBe(false);
    expect(r.traits).toEqual(['Brave', 'Cowardly']);
  });

  it('sandbox=invalido não afeta a extração de traits', () => {
    const r = parsePzrCode(makeCode({ sandbox: 'invalido', traits: 'Athletic' }))!;
    expect(r.sandboxOk).toBe(false);
    expect(r.traits).toEqual(['Athletic']);
  });

  it('código legado sem campo traits → traits vazio', () => {
    // Formato PZRX2 com apenas 7 campos (sem traits)
    const plain = 'PZR|Nome|Prof|100|1440|Corrida 5|morto|ok';
    const r = parsePzrCode('PZRX2:' + obfuscate(plain))!;
    expect(r.traits).toEqual([]);
  });

});

// ─── 2. Sync route: armazenamento no BD ─────────────────────────────────────

describe('sync route — lógica de persistência de traits', () => {

  it('novo save com traits → stored = CSV das traits', () => {
    const r = parsePzrCode(makeCode({ traits: 'Athletic,Lucky,Smoker' }))!;
    expect(toStoredTraits(r)).toBe('Athletic,Lucky,Smoker');
  });

  it('novo save sem traits → stored = null', () => {
    const r = parsePzrCode(makeCode({ traits: '' }))!;
    expect(toStoredTraits(r)).toBeNull();
  });

  it('save em andamento: mesmo personagem, mais kills → traits idênticas', () => {
    const traits = 'Athletic,Lucky,Smoker';
    const sync1 = toStoredTraits(parsePzrCode(makeCode({ kills: 100,  traits }))!);
    const sync2 = toStoredTraits(parsePzrCode(makeCode({ kills: 9000, traits }))!);
    expect(sync1).toBe('Athletic,Lucky,Smoker');
    expect(sync2).toBe('Athletic,Lucky,Smoker');
    expect(sync1).toBe(sync2);
  });

  it('save em andamento: traits refletem estado atual (remoção de trait)', () => {
    // Jogador pode remover traits com XP em B42 — sync deve refletir estado atual
    const r1 = parsePzrCode(makeCode({ kills: 100,  traits: 'Athletic,Smoker' }))!;
    const r2 = parsePzrCode(makeCode({ kills: 5000, traits: 'Athletic' }))!;
    expect(toStoredTraits(r1)).toBe('Athletic,Smoker');
    expect(toStoredTraits(r2)).toBe('Athletic');
  });

  it('personagem morto: traits armazenadas normalmente', () => {
    const r = parsePzrCode(makeCode({ status: 'morto', traits: 'Brave,Cowardly' }))!;
    expect(toStoredTraits(r)).toBe('Brave,Cowardly');
  });

  it('desclassificado: traits extraídas pelo decoder (não armazenadas pelo sync)', () => {
    // O sync.ts retorna cedo para sandbox=invalido sem UPDATE de traits.
    // Mas o decoder em si deve extrair corretamente.
    const r = parsePzrCode(makeCode({ sandbox: 'invalido', traits: 'Athletic,Lucky' }))!;
    expect(r.sandboxOk).toBe(false);
    // traits decodificadas corretamente — responsabilidade de não persistir é da rota
    expect(toStoredTraits(r)).toBe('Athletic,Lucky');
  });

});

// ─── 3. SKILL_NAMES: IDs B42 corretos (sanidade pós-fix) ────────────────────

describe('SKILL_NAMES — sanidade dos IDs B42', () => {

  const B42_IDS = [
    'Sprinting', 'Lightfoot', 'Nimble', 'Sneak', 'Fitness', 'Strength',
    'Axe', 'Blunt', 'SmallBlunt', 'LongBlade', 'SmallBlade', 'Spear', 'Maintenance',
    'Aiming', 'Reloading', 'Woodwork', 'Electricity', 'MetalWelding', 'Mechanics',
    'Tailoring', 'Cooking', 'Farming', 'Doctor', 'Fishing', 'Trapping', 'Survivalist',
    'FlintKnapping', 'Carving', 'Masonry', 'Pottery', 'Blacksmith', 'Glassmaking',
    'Husbandry', 'Butchering', 'Tracking',
  ];

  it('total de 35 skills', () => {
    expect(Object.keys(SKILL_NAMES)).toHaveLength(35);
  });

  it('todos os IDs B42 estão presentes', () => {
    for (const id of B42_IDS) expect(SKILL_NAMES).toHaveProperty(id);
  });

  it('IDs B41 renomeados foram removidos', () => {
    const obsolete = ['Lightfooted', 'Sneaking', 'LongBlunt', 'ShortBlunt',
                      'ShortBlade', 'Carpentry', 'Electrical', 'Foraging',
                      'FirstAid', 'Agriculture', 'Knapping', 'AnimalCare'];
    for (const id of obsolete) expect(SKILL_NAMES).not.toHaveProperty(id);
  });

  it('todos os valores são nomes PT-BR válidos', () => {
    for (const [id, name] of Object.entries(SKILL_NAMES)) {
      expect(name.length).toBeGreaterThan(0);
      expect(name).not.toBe(id); // nome não pode ser igual ao ID inglês
    }
  });

});

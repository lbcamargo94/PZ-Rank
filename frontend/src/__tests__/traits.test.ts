/**
 * Testes do pipeline de traits — camada frontend.
 *
 * Cobre:
 *  1. parseTraitList — parsing do CSV que vem do BD
 *  2. resolveTrait   — tradução ID → PT-BR + tipo positivo/negativo
 *  3. TRAITS map     — cobertura de todos os IDs B42 conhecidos
 *  4. Cenário novo save e save em andamento
 */

import { describe, it, expect } from 'vitest';
import { parseTraitList, resolveTrait, TRAITS } from '../lib/traits';

// ─── IDs B42 conhecidos (mesma lista do backend) ────────────────────────────

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

// Amostras para testes de resolução com nome esperado
const POSITIVE_TRAITS: [string, string][] = [
  ['Athletic',      'Atlético'],
  ['Fit',           'Em Forma'],
  ['Strong',        'Forte'],
  ['Lucky',         'Sortudo'],
  ['FastLearner',   'Aprendiz Rápido'],
  ['FastReader',    'Leitor Rápido'],
  ['Brave',         'Corajoso'],
  ['Organized',     'Organizado'],
  ['KeenHearing',   'Audição Aguçada'],
  ['EagleEyed',     'Olho de Águia'],
  ['IronGut',       'Estômago de Ferro'],
  ['Inconspicuous', 'Discreto'],
  ['CatEyes',       'Olhos de Gato'],
  ['SpeedDemon',    'Demônio da Velocidade'],
  ['Outdoorsman',   'Sobrevivencialista'],
  ['Desensitized',  'Dessensibilizado'],
];

const NEGATIVE_TRAITS: [string, string][] = [
  ['Smoker',        'Fumante'],
  ['Weak',          'Fraco'],
  ['Unfit',         'Sem Condicionamento'],
  ['Obese',         'Obeso'],
  ['Cowardly',      'Covarde'],
  ['Clumsy',        'Desajeitado'],
  ['SlowReader',    'Leitor Lento'],
  ['SlowLearner',   'Aprendiz Lento'],
  ['Sleepyhead',    'Dorminhoco'],
  ['Pacifist',      'Pacifista'],
  ['HardOfHearing', 'Duro de Ouvido'],
  ['ShortSighted',  'Míope'],
  ['Claustrophobic','Claustrofóbico'],
  ['Illiterate',    'Analfabeto'],
];

// ─── 1. parseTraitList ───────────────────────────────────────────────────────

describe('parseTraitList', () => {

  it('null → []', () => expect(parseTraitList(null)).toEqual([]));
  it('undefined → []', () => expect(parseTraitList(undefined)).toEqual([]));
  it('string vazia → []', () => expect(parseTraitList('')).toEqual([]));

  it('CSV simples', () => {
    expect(parseTraitList('Athletic,Lucky,Smoker'))
      .toEqual(['Athletic', 'Lucky', 'Smoker']);
  });

  it('trim de espaços em cada token', () => {
    expect(parseTraitList('Athletic, Lucky , Smoker'))
      .toEqual(['Athletic', 'Lucky', 'Smoker']);
  });

  it('filtra tokens vazios (vírgulas duplas / bordas)', () => {
    expect(parseTraitList(',Athletic,,Smoker,')).toEqual(['Athletic', 'Smoker']);
  });

  it('trait única', () => {
    expect(parseTraitList('Brave')).toEqual(['Brave']);
  });

  it('preserva a ordem', () => {
    const ids = ['Smoker', 'Athletic', 'Cowardly', 'FastLearner'];
    expect(parseTraitList(ids.join(','))).toEqual(ids);
  });

  it('case-sensitive (PZ envia PascalCase)', () => {
    // "athletic" (lowercase) não é o mesmo que "Athletic"
    expect(parseTraitList('athletic')).toEqual(['athletic']);
  });

  it('processa todos os IDs B42 de uma vez', () => {
    const csv    = KNOWN_B42_TRAIT_IDS.join(',');
    const result = parseTraitList(csv);
    expect(result).toHaveLength(KNOWN_B42_TRAIT_IDS.length);
    for (const id of KNOWN_B42_TRAIT_IDS) expect(result).toContain(id);
  });

});

// ─── 2. resolveTrait — positivas ─────────────────────────────────────────────

describe('resolveTrait — traits positivas', () => {
  for (const [id, name] of POSITIVE_TRAITS) {
    it(`${id} → "${name}"`, () => {
      const def = resolveTrait(id);
      expect(def.name).toBe(name);
      expect(def.type).toBe('positive');
    });
  }
});

// ─── 3. resolveTrait — negativas ─────────────────────────────────────────────

describe('resolveTrait — traits negativas', () => {
  for (const [id, name] of NEGATIVE_TRAITS) {
    it(`${id} → "${name}"`, () => {
      const def = resolveTrait(id);
      expect(def.name).toBe(name);
      expect(def.type).toBe('negative');
    });
  }
});

// ─── 4. resolveTrait — fallback ───────────────────────────────────────────────

describe('resolveTrait — fallback para IDs desconhecidos', () => {

  it('retorna o próprio ID como nome', () => {
    expect(resolveTrait('TraitDesconhecida2099').name).toBe('TraitDesconhecida2099');
  });

  it('type padrão = positive para IDs desconhecidos', () => {
    expect(resolveTrait('SomeFutureTrait').type).toBe('positive');
  });

  it('não lança exceção para qualquer string', () => {
    expect(() => resolveTrait('')).not.toThrow();
    expect(() => resolveTrait('   ')).not.toThrow();
    expect(() => resolveTrait('123abc')).not.toThrow();
  });

});

// ─── 5. TRAITS map — cobertura e validade ────────────────────────────────────

describe('TRAITS map — cobertura B42', () => {

  it('todos os IDs B42 conhecidos estão no mapa', () => {
    for (const id of KNOWN_B42_TRAIT_IDS) {
      expect(TRAITS).toHaveProperty(id);
    }
  });

  it('todas as entradas têm type positivo ou negativo', () => {
    for (const def of Object.values(TRAITS)) {
      expect(['positive', 'negative']).toContain(def.type);
    }
  });

  it('todos os nomes PT-BR são não-vazios', () => {
    for (const [id, def] of Object.entries(TRAITS)) {
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.name).not.toBe(id); // nome não deve ser o ID inglês
    }
  });

  it('campo image é undefined ou string não-vazia', () => {
    for (const def of Object.values(TRAITS)) {
      if (def.image !== undefined) {
        expect(typeof def.image).toBe('string');
        expect(def.image.length).toBeGreaterThan(0);
      }
    }
  });

  it('não contém Wakeful2 (ID inválido removido)', () => {
    expect(TRAITS).not.toHaveProperty('Wakeful2');
  });

});

// ─── 6. Cenário novo save ────────────────────────────────────────────────────

describe('exibição — novo save', () => {

  it('CSV armazenado pelo sync → IDs corretos', () => {
    // O sync.ts persiste decoded.traits.join(',')
    const stored = 'Athletic,Lucky,Smoker';
    const ids    = parseTraitList(stored);
    expect(ids).toEqual(['Athletic', 'Lucky', 'Smoker']);
    expect(resolveTrait(ids[0]!).name).toBe('Atlético');
    expect(resolveTrait(ids[1]!).name).toBe('Sortudo');
    expect(resolveTrait(ids[2]!).name).toBe('Fumante');
  });

  it('traits null → lista vazia → TraitsSection mostraria banner', () => {
    expect(parseTraitList(null)).toHaveLength(0);
  });

  it('separação positivas / negativas funciona para CSV do sync', () => {
    const ids      = parseTraitList('Athletic,Brave,Smoker,Cowardly,Lucky');
    const positive = ids.filter(id => resolveTrait(id).type === 'positive');
    const negative = ids.filter(id => resolveTrait(id).type === 'negative');

    expect(positive.sort()).toEqual(['Athletic', 'Brave', 'Lucky'].sort());
    expect(negative.sort()).toEqual(['Cowardly', 'Smoker'].sort());
  });

  it('todos os IDs B42 exibem nome PT-BR (sem fallback para inglês)', () => {
    for (const id of KNOWN_B42_TRAIT_IDS) {
      expect(resolveTrait(id).name).not.toBe(id);
    }
  });

});

// ─── 7. Cenário save em andamento ────────────────────────────────────────────

describe('exibição — save em andamento', () => {

  it('traits iguais entre syncs quando personagem não muda', () => {
    const a = parseTraitList('Athletic,Lucky,Smoker');
    const b = parseTraitList('Athletic,Lucky,Smoker');
    expect(a).toEqual(b);
  });

  it('traits atualizadas quando personagem muda (ex: removeu Smoker)', () => {
    const comSmoker = parseTraitList('Athletic,Smoker');
    const semSmoker = parseTraitList('Athletic');
    expect(comSmoker).toContain('Smoker');
    expect(semSmoker).not.toContain('Smoker');
  });

  it('personagem morto: traits exibidas idêntico ao vivo', () => {
    // is_alive não muda o parsing de traits
    const ids = parseTraitList('Brave,Cowardly');
    expect(resolveTrait(ids[0]!).type).toBe('positive');
    expect(resolveTrait(ids[1]!).type).toBe('negative');
  });

});

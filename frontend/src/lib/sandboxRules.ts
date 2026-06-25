// Regras do Desafio Brasileirão — espelho do RankSandbox.lua
// Mantido em sincronia com o mod para validação no frontend.

export interface SandboxRule {
  key:      string;
  expected: number | boolean;
  label:    string;
  tol?:     number;
}

export const SANDBOX_RULES: SandboxRule[] = [
  // Zumbis — População
  { key: 'ZombieConfig.PopulationMultiplier',      expected: 4.0,  label: 'Pop. Multiplicador',            tol: 0.05 },
  { key: 'ZombieConfig.PopulationStartMultiplier', expected: 2.0,  label: 'Pop. Inicial',                   tol: 0.05 },
  { key: 'ZombieConfig.PopulationPeakMultiplier',  expected: 2.0,  label: 'Pop. Pico',                      tol: 0.05 },
  { key: 'ZombieConfig.PopulationPeakDay',         expected: 1,    label: 'Dia do Pico' },
  // Zumbis — Comportamento
  { key: 'ZombieLore.Speed',                       expected: 4,    label: 'Velocidade (Aleatório=4)' },
  { key: 'ZombieLore.SprinterPercentage',          expected: 0,    label: '% Corredores (0)' },
  { key: 'ZombieLore.Strength',                    expected: 1,    label: 'Força (Super-humano=1)' },
  { key: 'ZombieLore.Toughness',                   expected: 1,    label: 'Resistência (Resistente=1)' },
  { key: 'ZombieLore.Hearing',                     expected: 1,    label: 'Audição (Alta=1)' },
  { key: 'ZombieLore.Sight',                       expected: 1,    label: 'Visão (Águia=1)' },
  { key: 'ZombieLore.Memory',                      expected: 1,    label: 'Memória (Longa=1)' },
  { key: 'ZombieLore.Cognition',                   expected: 1,    label: 'Percepção/Portas (Avançado=1)' },
  { key: 'ZombieConfig.FollowSoundDistance',        expected: 100,  label: 'Raio de Audição (100)' },
  { key: 'ZombieLore.DisableFakeDead',             expected: 2,    label: 'Fake Dead Total (2)' },
  { key: 'ZombieLore.ZombiesCrawlersDragDown',     expected: true, label: 'Rastejadores Derrubam' },
  { key: 'ZombieConfig.RallyGroupSize',            expected: 1,    label: 'Tamanho da Horda (1)' },
  // Loot — todas as 22 categorias do B42 (0.04 = Muito Baixo)
  { key: 'FoodLootNew',          expected: 0.04, label: 'Comida',                     tol: 0.01 },
  { key: 'CannedFoodLootNew',    expected: 0.04, label: 'Comida Enlatada',             tol: 0.01 },
  { key: 'WeaponLootNew',        expected: 0.04, label: 'Armas Corpo a Corpo',         tol: 0.01 },
  { key: 'RangedWeaponLootNew',  expected: 0.04, label: 'Armas de Longo Alcance',      tol: 0.01 },
  { key: 'AmmoLootNew',          expected: 0.04, label: 'Munição',                     tol: 0.01 },
  { key: 'MedicalLootNew',       expected: 0.04, label: 'Médico',                      tol: 0.01 },
  { key: 'SurvivalGearsLootNew', expected: 0.04, label: 'Equipamentos de Sobrev.',     tol: 0.01 },
  { key: 'ClothingLootNew',      expected: 0.04, label: 'Roupas',                      tol: 0.01 },
  { key: 'MechanicsLootNew',     expected: 0.04, label: 'Mecânica',                    tol: 0.01 },
  { key: 'ToolLootNew',          expected: 0.04, label: 'Ferramentas',                 tol: 0.01 },
  { key: 'MaterialLootNew',      expected: 0.04, label: 'Materiais',                   tol: 0.01 },
  { key: 'CookwareLootNew',      expected: 0.04, label: 'Utensílios de Cozinha',       tol: 0.01 },
  { key: 'FarmingLootNew',       expected: 0.04, label: 'Agricultura',                 tol: 0.01 },
  { key: 'SkillBookLoot',        expected: 0.04, label: 'Livros de Habilidade',        tol: 0.01 },
  { key: 'LiteratureLootNew',    expected: 0.04, label: 'Literatura',                  tol: 0.01 },
  { key: 'RecipeResourceLoot',   expected: 0.04, label: 'Recursos de Receitas',        tol: 0.01 },
  { key: 'MediaLootNew',         expected: 0.04, label: 'Mídia',                       tol: 0.01 },
  { key: 'MementoLootNew',       expected: 0.04, label: 'Lembranças',                  tol: 0.01 },
  { key: 'ContainerLootNew',     expected: 0.04, label: 'Containers',                  tol: 0.01 },
  { key: 'KeyLootNew',           expected: 0.04, label: 'Chaves',                      tol: 0.01 },
  { key: 'OtherLootNew',         expected: 0.04, label: 'Outros Itens',                tol: 0.01 },
  { key: 'GeneratorSpawning',    expected: 1,    label: 'Geradores (Ext.Raro=1)' },
  // Mundo
  { key: 'WaterShut',                              expected: 1,    label: 'Água Instantânea (1)' },
  { key: 'ElecShut',                               expected: 1,    label: 'Eletricidade Instantânea (1)' },
  { key: 'AlarmDecay',                             expected: 6,    label: 'Bateria Alarme (0-5 Anos=6)' },
  { key: 'Alarm',                                  expected: 6,    label: 'Alarmes Casas (Muito Freq.=6)' },
  // Natureza
  { key: 'NightDarkness',                          expected: 2,    label: 'Escuridão Noite (Escuro=2)' },
  { key: 'Temperature',                            expected: 2,    label: 'Temperatura (Frio=2)' },
  { key: 'Rain',                                   expected: 2,    label: 'Chuva (Seco=2)' },
  { key: 'FishAbundance',                          expected: 1,    label: 'Pesca (Muito Ruim=1)' },
  { key: 'NatureAbundance',                        expected: 1,    label: 'Natureza (Muito Ruim=1)' },
  // Ambiente
  { key: 'MetaEvent',                              expected: 3,    label: 'Eventos Aleatórios (Freq.=3)' },
  // Personagem
  { key: 'MultiplierConfig.Global',                expected: 0.8,  label: 'Mult. XP Global (0.8)',  tol: 0.05 },
  // Veículos
  { key: 'ChanceHasGas',                           expected: 1,    label: 'Gasolina (Baixo=1)' },
  { key: 'InitialGas',                             expected: 1,    label: 'Gasolina Inicial (M.Baixo=1)' },
  { key: 'LockedCar',                              expected: 6,    label: 'Veículos Trancados (M.Freq.=6)' },
  { key: 'CarGeneralCondition',                    expected: 1,    label: 'Cond. Veículos (M.Baixo=1)' },
  // Animais
  { key: 'AnimalRanchChance',                      expected: 2,    label: 'Animais (Ext.Raro=2)' },
];

export function getNestedValue(obj: Record<string, unknown>, dotPath: string): unknown {
  return dotPath.split('.').reduce<unknown>((cur, key) => {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    return (cur as Record<string, unknown>)[key];
  }, obj);
}

export interface RuleResult {
  rule:     SandboxRule;
  actual:   unknown;
  ok:       boolean;
  missing:  boolean;
}

export function validateSandbox(sandboxData: Record<string, unknown>): RuleResult[] {
  return SANDBOX_RULES.map(rule => {
    const actual = getNestedValue(sandboxData, rule.key);
    const missing = actual === undefined || actual === null;
    if (missing) return { rule, actual: null, ok: false, missing: true };

    let ok = false;
    if (typeof rule.expected === 'boolean') {
      ok = actual === rule.expected;
    } else if (typeof rule.expected === 'number' && typeof actual === 'number') {
      ok = Math.abs(actual - rule.expected) <= (rule.tol ?? 0.01);
    } else {
      ok = actual === rule.expected;
    }
    return { rule, actual, ok, missing: false };
  });
}
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
  { key: 'ZombieConfig.PopulationStartMultiplier', expected: 2.5,  label: 'Pop. Inicial',                   tol: 0.05 },
  { key: 'ZombieConfig.PopulationPeakMultiplier',  expected: 2.5,  label: 'Pop. Pico',                      tol: 0.05 },
  { key: 'ZombieConfig.PopulationPeakDay',         expected: 1,    label: 'Dia do Pico' },
  { key: 'ZombieConfig.RespawnHours',              expected: 0.0,  label: 'Respawn (Nenhum=0)',             tol: 0.01 },
  { key: 'ZombieConfig.RedistributeHours',         expected: 24.0, label: 'Migração de Zumbis (24h)',       tol: 0.5  },
  { key: 'ZombieConfig.RallyGroupSizeVariance',    expected: 50,   label: 'Variância Horda (50)' },
  { key: 'ZombieConfig.RallyTravelDistance',       expected: 20,   label: 'Distância Rally (20)' },
  { key: 'ZombieConfig.RallyGroupSeparation',      expected: 15,   label: 'Separação de Horda (15)' },
  { key: 'ZombieConfig.RallyGroupRadius',          expected: 3,    label: 'Raio de Horda (3)' },
  // Zumbis — Comportamento
  { key: 'ZombieLore.Speed',                       expected: 2,    label: 'Velocidade (Normal=2)' },
  { key: 'ZombieLore.SprinterPercentage',          expected: 0,    label: '% Corredores (0)' },
  { key: 'ZombieLore.Strength',                    expected: 1,    label: 'Força (Super-humano=1)' },
  { key: 'ZombieLore.Toughness',                   expected: 2,    label: 'Resistência (Normal=2)' },
  { key: 'ZombieLore.Reanimate',                   expected: 1,    label: 'Reanimação (Instantâneo=1)' },
  { key: 'ZombieLore.Hearing',                     expected: 1,    label: 'Audição (Alta=1)' },
  { key: 'ZombieLore.Sight',                       expected: 1,    label: 'Visão (Águia=1)' },
  { key: 'ZombieLore.Memory',                      expected: 1,    label: 'Memória (Longa=1)' },
  { key: 'ZombieLore.Cognition',                   expected: 1,    label: 'Percepção/Portas (Avançado=1)' },
  { key: 'ZombieConfig.FollowSoundDistance',        expected: 600,  label: 'Raio de Audição (600)' },
  { key: 'ZombieLore.DisableFakeDead',             expected: 2,    label: 'Fake Dead Ativado Total (2)' },
  { key: 'ZombieLore.ZombiesCrawlersDragDown',     expected: true, label: 'Rastejadores Derrubam' },
  { key: 'ZombieConfig.RallyGroupSize',            expected: 0,    label: 'Tamanho da Horda (0)' },
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
  { key: 'GeneratorSpawning',    expected: 3,    label: 'Geradores (Raro=3)' },
  // Mundo
  { key: 'ZombieVoronoiNoise',                      expected: true,  label: 'Voronoi Noise (Ativado)' },
  { key: 'WaterShut',                               expected: 1,    label: 'Água Instantânea (1)' },
  { key: 'ElecShut',                                expected: 1,    label: 'Eletricidade Instantânea (1)' },
  { key: 'AlarmDecay',                              expected: 6,    label: 'Bateria Alarme (0-5 Anos=6)' },
  { key: 'Alarm',                                   expected: 6,    label: 'Alarmes Casas (Muito Freq.=6)' },
  // Natureza
  { key: 'NightDarkness',                           expected: 3,    label: 'Escuridão Noite (Normal=3)' },
  { key: 'Temperature',                             expected: 2,    label: 'Temperatura (Frio=2)' },
  { key: 'Rain',                                    expected: 2,    label: 'Chuva (Seco=2)' },
  { key: 'FishAbundance',                           expected: 2,    label: 'Pesca (Ruim=2)' },
  { key: 'NatureAbundance',                         expected: 2,    label: 'Natureza (Ruim=2)' },
  // Ambiente
  { key: 'MetaEvent',    expected: 1,    label: 'Eventos Aleatórios (Nunca=1)' },
  { key: 'FireSpread',   expected: true, label: 'Fogo se Espalha (Ativado)' },
  // Eventos
  { key: 'Helicopter',   expected: 2, label: 'Helicóptero (Algumas Vezes=2)' },
  { key: 'LockedHouses', expected: 6, label: 'Casas Trancadas (Muito Freq.=6)' },
  { key: 'CarAlarm',     expected: 6, label: 'Alarme Carros (Muito Freq.=6)' },
  // Personagem
  { key: 'MultiplierConfig.Global', expected: 0.8,   label: 'Mult. XP Global (0.8)',        tol: 0.05 },
  { key: 'StarterKit',              expected: false,  label: 'Kit Inicial (Desabilitado)' },
  { key: 'CharacterFreePoints',     expected: 0,      label: 'Pontos Livres (0)' },
  { key: 'MultiHitZombies',         expected: false,  label: 'Multi-Hit Zumbis (Desabilitado)' },
  { key: 'EasyClimbing',            expected: false,  label: 'Escalar Fácil (Desabilitado)' },
  { key: 'BoneFracture',            expected: true,   label: 'Fraturas Ósseas (Ativado)' },
  { key: 'AttackBlockMovements',    expected: true,   label: 'Bloqueio p/ Ataque (Ativado)' },
  // Zumbis — comportamento (complemento)
  { key: 'ZombieLore.Transmission',              expected: 2,    label: 'Transmissão (Saliva=2)' },
  // Dificuldade B42.20
  { key: 'ZombieLore.ZombiesArmorFactor',        expected: 2.0,  label: 'Armadura Zumbi (2.0)',            tol: 0.05 },
  { key: 'ZombieLore.ChanceOfAttachedWeapon',    expected: 6,    label: 'Chance Arma no Zumbi (6)' },
  { key: 'ZombieLore.FenceDamageMultiplier',     expected: 2.0,  label: 'Dano em Cercas (2.0)',            tol: 0.05 },
  { key: 'ZombieLore.ZombiesFallDamage',         expected: 1.0,  label: 'Dano de Queda Zumbi (1.0)',       tol: 0.05 },
  // Loot — Efeito Populacao B42.20
  { key: 'ZombiePopLootEffect',                  expected: 2,    label: 'Efeito Pop. no Loot (2)' },
  // Armas de fogo — Dificuldade B42.20
  { key: 'FirearmNoiseMultiplier',               expected: 2.0,  label: 'Ruído Armas de Fogo (2.0)',       tol: 0.05 },
  // Veículos
  { key: 'ChanceHasGas',            expected: 1,     label: 'Gasolina (Baixo=1)' },
  { key: 'InitialGas',              expected: 1,     label: 'Gasolina Inicial (M.Baixo=1)' },
  { key: 'LockedCar',               expected: 6,     label: 'Veículos Trancados (M.Freq.=6)' },
  { key: 'CarGeneralCondition',     expected: 1,     label: 'Cond. Veículos (M.Baixo=1)' },
  { key: 'FuelStationGasInfinite',  expected: false, label: 'Gasolina Infinita (Desabilitado)' },
  { key: 'VehicleEasyUse',          expected: false, label: 'Veículos Fáceis (Desabilitado)' },
  // Mapa
  { key: 'Map.MapAllKnown', expected: true, label: 'Mapa Aberto (Obrigatório)' },
  // Animais
  { key: 'AnimalRanchChance', expected: 3, label: 'Animais (Raro=3)' },
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

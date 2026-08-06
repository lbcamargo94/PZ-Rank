import { parseSkillMap } from './skills';
import type { Entry } from '../types';

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface Archetype {
  id:    string;
  name:  string;
  icon:  string;
  desc:  string;
  color: string;
}

export interface TraitBar {
  key:   string;
  label: string;
  icon:  string;
  score: number;
  max:   number;
  color: string;
}

export interface TraitTag {
  id:    string;
  label: string;
  icon:  string;
  color: string;
}

export interface ArchetypeResult {
  primary:   Archetype;
  secondary: Archetype | null;
  traits:    TraitBar[];
  tags:      TraitTag[];   // até 5 conquistas comportamentais do jogador
}

// ─── Archetypes ───────────────────────────────────────────────────────────────

const ARCHETYPES: Record<string, Archetype> = {
  berserker: { id: 'berserker', name: 'Berserker',   icon: '🪓', color: '#e04040', desc: 'Combatente nato. Deixa um rastro de mortos por onde passa.'                   },
  hunter:    { id: 'hunter',    name: 'Caçador',      icon: '🏹', color: '#c8a84b', desc: 'Mestre das armadilhas e do rastreamento. A floresta é seu lar.'               },
  builder:   { id: 'builder',   name: 'Construtor',   icon: '🏰', color: '#7ab8e0', desc: 'Ergue bases onde outros apenas sobrevivem.'                                   },
  artisan:   { id: 'artisan',   name: 'Artesão',      icon: '🏺', color: '#d4875a', desc: 'Molda o mundo com suas mãos. Do barro ao metal, nada escapa ao seu engenho.' },
  explorer:  { id: 'explorer',  name: 'Explorador',   icon: '🚗', color: '#c87828', desc: 'Não para de se mover. Conhece cada rua do mapa.'                             },
  medic:     { id: 'medic',     name: 'Médico',       icon: '🩺', color: '#7ac050', desc: 'Mantém o grupo de pé mesmo nas piores situações.'                            },
  farmer:    { id: 'farmer',    name: 'Fazendeiro',   icon: '🌾', color: '#6ab840', desc: 'Encontrou sustento onde ninguém mais encontrou.'                             },
  ghost:     { id: 'ghost',     name: 'Fantasma',     icon: '🥷', color: '#9099a5', desc: 'Passa despercebido. Os zumbis nem sabem que ele existe.'                     },
  survivor:  { id: 'survivor',  name: 'Sobrevivente', icon: '🛡️', color: '#b0a890', desc: 'Equilibrado e resiliente. Ainda está de pé — isso já é muito.'               },
};

// ─── Entry type ───────────────────────────────────────────────────────────────

type ArchetypeEntry = Pick<Entry,
  'kills' | 'days' | 'skills' |
  'animals_killed' | 'fish_caught' | 'crops_harvested' | 'crops_planted' |
  'items_crafted'  | 'houses_looted' | 'hours_without_sleep' |
  'trees_cut'      | 'books_read'    | 'structures_built' |
  'animal_tracks'  | 'stone_structures' |
  'eggs_collected' | 'milk_produced' | 'meals_cooked' | 'water_collected' |
  'km_driven'      | 'cities_visited' | 'military_visited' |
  'forged_weapons' | 'ceramic_items'  | 'materials_crafted'
>;

// ─── Trait Tags ───────────────────────────────────────────────────────────────
// Cada grupo exibe apenas o tag de maior peso que o jogador desbloqueou.
// São exibidos até 5 grupos (sorted por peso decrescente).

interface TagDef {
  id:     string;
  label:  string;
  icon:   string;
  color:  string;
  group:  string;   // exibição exclusiva por grupo
  weight: number;   // peso de impressividade (maior = raro)
  check:  (e: ArchetypeEntry, sm: Map<string, number>) => boolean;
}

const TAG_DEFS: TagDef[] = [

  // ── Kills ───────────────────────────────────────────────────────────────
  { id: 'apocalypse',  group: 'kills', weight: 100, label: 'Apocalipse',     icon: '☠️',  color: '#8b0000',
    check: e => e.kills >= 50000 },
  { id: 'terminator',  group: 'kills', weight: 80,  label: 'Exterminador',   icon: '💀',  color: '#c02020',
    check: e => e.kills >= 10000 },
  { id: 'executioner', group: 'kills', weight: 60,  label: 'Carrasco',       icon: '🔪',  color: '#e04040',
    check: e => e.kills >= 3000  },
  { id: 'fighter',     group: 'kills', weight: 35,  label: 'Combatente',     icon: '⚔️',  color: '#e05858',
    check: e => e.kills >= 500   },

  // ── Tempo de sobrevivência ───────────────────────────────────────────────
  { id: 'legend',    group: 'survival', weight: 95, label: 'Lendário',       icon: '⭐',  color: '#ffd700',
    check: e => e.days >= 365 },
  { id: 'war_vet',   group: 'survival', weight: 70, label: 'Vet. de Guerra', icon: '🎖️', color: '#c8a84b',
    check: e => e.days >= 180 },
  { id: 'veteran',   group: 'survival', weight: 45, label: 'Veterano',       icon: '🏅',  color: '#a08030',
    check: e => e.days >= 90  },

  // ── KPD (kills por dia) ──────────────────────────────────────────────────
  { id: 'killing_machine', group: 'kpd', weight: 92, label: 'Máquina de Matar', icon: '🌪️', color: '#b00000',
    check: e => e.days > 0 && (e.kills / e.days) >= 200 },
  { id: 'aggressive',      group: 'kpd', weight: 65, label: 'Agressivo',         icon: '🔥', color: '#d02020',
    check: e => e.days > 0 && (e.kills / e.days) >= 80  },
  { id: 'relentless',      group: 'kpd', weight: 40, label: 'Implacável',        icon: '😤', color: '#c04040',
    check: e => e.days > 0 && (e.kills / e.days) >= 30  },

  // ── Horas sem dormir ─────────────────────────────────────────────────────
  { id: 'chronic_insomniac', group: 'sleep', weight: 85, label: 'Insone Crônico', icon: '🌙', color: '#4a2890',
    check: e => (e.hours_without_sleep ?? 0) >= 168 },
  { id: 'insomniac',         group: 'sleep', weight: 55, label: 'Insone',          icon: '😴', color: '#7060b0',
    check: e => (e.hours_without_sleep ?? 0) >= 72  },
  { id: 'night_owl',         group: 'sleep', weight: 30, label: 'Noturno',         icon: '🦉', color: '#9080c0',
    check: e => (e.hours_without_sleep ?? 0) >= 24  },

  // ── Direção (km_driven) ───────────────────────────────────────────────────
  { id: 'road_king',   group: 'driving', weight: 92, label: 'Rei da Estrada',  icon: '🏎️', color: '#e07020',
    check: e => (e.km_driven ?? 0) >= 1000 },
  { id: 'driver',      group: 'driving', weight: 62, label: 'Motorista',       icon: '🚗',  color: '#c87828',
    check: e => (e.km_driven ?? 0) >= 300  },
  { id: 'road_nomad',  group: 'driving', weight: 35, label: 'Nômade',          icon: '🛣️',  color: '#a07030',
    check: e => (e.km_driven ?? 0) >= 80   },

  // ── Cidades visitadas ─────────────────────────────────────────────────────
  { id: 'cartographer', group: 'cities', weight: 85, label: 'Cartógrafo',  icon: '🗺️', color: '#2090a0',
    check: e => (e.cities_visited ?? 0) >= 7 },
  { id: 'explorer_tag', group: 'cities', weight: 55, label: 'Explorador',  icon: '🧭', color: '#30a8b8',
    check: e => (e.cities_visited ?? 0) >= 3 },

  // ── Bases militares ───────────────────────────────────────────────────────
  { id: 'commando', group: 'military', weight: 72, label: 'Commando', icon: '🪖', color: '#4a7a4a',
    check: e => (e.military_visited ?? 0) >= 3 },
  { id: 'soldier',  group: 'military', weight: 48, label: 'Soldado',   icon: '🎯', color: '#5a8a5a',
    check: e => (e.military_visited ?? 0) >= 1 },

  // ── Animais abatidos ──────────────────────────────────────────────────────
  { id: 'apex_predator',  group: 'hunting', weight: 90, label: 'Predador Alfa',  icon: '🦁', color: '#8a5010',
    check: e => (e.animals_killed ?? 0) >= 500  },
  { id: 'poacher',        group: 'hunting', weight: 65, label: 'Caçador Furtivo',icon: '🏹', color: '#a07020',
    check: e => (e.animals_killed ?? 0) >= 200  },
  { id: 'hunter_tag',     group: 'hunting', weight: 40, label: 'Caçador',        icon: '🐗', color: '#c8a84b',
    check: e => (e.animals_killed ?? 0) >= 50   },

  // ── Pesca ─────────────────────────────────────────────────────────────────
  { id: 'master_fisherman', group: 'fishing', weight: 80, label: 'Mestre Pescador', icon: '🐠', color: '#1060a0',
    check: e => (e.fish_caught ?? 0) >= 200 },
  { id: 'fisherman_tag',    group: 'fishing', weight: 50, label: 'Pescador',         icon: '🎣', color: '#2878b8',
    check: e => (e.fish_caught ?? 0) >= 50  },

  // ── Rastreamento ──────────────────────────────────────────────────────────
  { id: 'master_tracker', group: 'tracking', weight: 78, label: 'Rastreador Mestre', icon: '🐾', color: '#7a5020',
    check: e => (e.animal_tracks ?? 0) >= 100 },
  { id: 'tracker_tag',    group: 'tracking', weight: 48, label: 'Rastreador',         icon: '🐾', color: '#9a7040',
    check: e => (e.animal_tracks ?? 0) >= 30  },

  // ── Construção ────────────────────────────────────────────────────────────
  { id: 'master_builder', group: 'building', weight: 90, label: 'Mestre Construtor', icon: '🏰', color: '#2a60a0',
    check: e => (e.structures_built ?? 0) >= 500 },
  { id: 'builder_tag',    group: 'building', weight: 62, label: 'Construtor',        icon: '🏗️', color: '#4a80be',
    check: e => (e.structures_built ?? 0) >= 100 },
  { id: 'handyman',       group: 'building', weight: 35, label: 'Faz-tudo',          icon: '🔧', color: '#6898d0',
    check: e => (e.structures_built ?? 0) >= 30  },

  // ── Estruturas de pedra ────────────────────────────────────────────────────
  { id: 'stonemason', group: 'stone', weight: 68, label: 'Pedreiro', icon: '🪨', color: '#6a6a80',
    check: e => (e.stone_structures ?? 0) >= 50 },

  // ── Agricultura ───────────────────────────────────────────────────────────
  { id: 'agronomist', group: 'farming', weight: 85, label: 'Agrônomo',   icon: '🌱', color: '#208020',
    check: e => (e.crops_harvested ?? 0) >= 500 },
  { id: 'farmer_tag', group: 'farming', weight: 55, label: 'Fazendeiro', icon: '🌾', color: '#4a9830',
    check: e => (e.crops_harvested ?? 0) >= 100 },
  { id: 'planter',    group: 'farming', weight: 30, label: 'Plantador',  icon: '🌿', color: '#6ab840',
    check: e => (e.crops_planted ?? 0) >= 30   },

  // ── Culinária ─────────────────────────────────────────────────────────────
  { id: 'star_chef',   group: 'cooking', weight: 88, label: 'Chef Estrelado', icon: '⭐', color: '#e05010',
    check: e => (e.meals_cooked ?? 0) >= 200 },
  { id: 'chef_tag',    group: 'cooking', weight: 58, label: 'Chef',           icon: '👨‍🍳',color: '#f07030',
    check: e => (e.meals_cooked ?? 0) >= 50  },
  { id: 'cook_tag',    group: 'cooking', weight: 32, label: 'Cozinheiro',     icon: '🍳', color: '#f09050',
    check: e => (e.meals_cooked ?? 0) >= 15  },

  // ── Pecuária ──────────────────────────────────────────────────────────────
  { id: 'rancher', group: 'livestock', weight: 72, label: 'Pecuarista', icon: '🐄', color: '#a08030',
    check: e => (e.eggs_collected ?? 0) + (e.milk_produced ?? 0) >= 100 },
  { id: 'farmhand',group: 'livestock', weight: 42, label: 'Vaqueiro',   icon: '🐔', color: '#b09040',
    check: e => (e.eggs_collected ?? 0) + (e.milk_produced ?? 0) >= 30  },

  // ── Forja ─────────────────────────────────────────────────────────────────
  { id: 'master_smith', group: 'forging', weight: 90, label: 'Mestre Ferreiro', icon: '⚒️', color: '#a04010',
    check: e => (e.forged_weapons ?? 0) >= 100 },
  { id: 'blacksmith',   group: 'forging', weight: 62, label: 'Ferreiro',        icon: '🔨', color: '#c06030',
    check: e => (e.forged_weapons ?? 0) >= 20  },

  // ── Cerâmica ──────────────────────────────────────────────────────────────
  { id: 'master_potter', group: 'pottery', weight: 82, label: 'Ceramista',  icon: '🏺', color: '#b04030',
    check: e => (e.ceramic_items ?? 0) >= 100 },
  { id: 'potter_tag',    group: 'pottery', weight: 52, label: 'Oleiro',     icon: '🏺', color: '#c05040',
    check: e => (e.ceramic_items ?? 0) >= 30  },

  // ── Artesanato geral ──────────────────────────────────────────────────────
  { id: 'artisan_tag',   group: 'crafting', weight: 75, label: 'Artesão',       icon: '🛠️', color: '#985030',
    check: e => (e.materials_crafted ?? 0) >= 200 },
  { id: 'craftsman_tag', group: 'crafting', weight: 45, label: 'Artesão',       icon: '🛠️', color: '#a86040',
    check: e => (e.materials_crafted ?? 0) >= 50  },

  // ── Saque ─────────────────────────────────────────────────────────────────
  { id: 'king_of_loot', group: 'looting', weight: 88, label: 'Rei do Saque', icon: '💰', color: '#b07010',
    check: e => (e.houses_looted ?? 0) >= 300 },
  { id: 'looter',       group: 'looting', weight: 58, label: 'Saqueador',    icon: '🏚️', color: '#a06020',
    check: e => (e.houses_looted ?? 0) >= 80  },
  { id: 'scavenger',    group: 'looting', weight: 30, label: 'Catador',      icon: '🗑️', color: '#807040',
    check: e => (e.houses_looted ?? 0) >= 20  },

  // ── Leitura ───────────────────────────────────────────────────────────────
  { id: 'bibliophile', group: 'reading', weight: 85, label: 'Bibliófilo', icon: '📚', color: '#6020a0',
    check: e => (e.books_read ?? 0) >= 50 },
  { id: 'literate',    group: 'reading', weight: 55, label: 'Letrado',    icon: '📖', color: '#8040c0',
    check: e => (e.books_read ?? 0) >= 15 },

  // ── Lenhador ──────────────────────────────────────────────────────────────
  { id: 'woodsman_master', group: 'woodcutting', weight: 80, label: 'Lenhador Mestre', icon: '🌲', color: '#4a2808',
    check: e => (e.trees_cut ?? 0) >= 500 },
  { id: 'woodsman',        group: 'woodcutting', weight: 52, label: 'Lenhador',        icon: '🪵', color: '#6a3810',
    check: e => (e.trees_cut ?? 0) >= 150 },

  // ── Água ──────────────────────────────────────────────────────────────────
  { id: 'water_guardian', group: 'water', weight: 72, label: 'Guarda da Água', icon: '💧', color: '#1870b0',
    check: e => (e.water_collected ?? 0) >= 200 },

  // ── Skills: pico ──────────────────────────────────────────────────────────
  { id: 'skill_master', group: 'skill_peak', weight: 92, label: 'Mestre Absoluto', icon: '🏆', color: '#d4a000',
    check: (_, sm) => [...sm.values()].some(l => l >= 10) },
  { id: 'specialist',   group: 'skill_peak', weight: 65, label: 'Especialista',    icon: '🎯', color: '#c08000',
    check: (_, sm) => [...sm.values()].some(l => l >= 8)  },

  // ── Skills: diversidade ────────────────────────────────────────────────────
  { id: 'generalist',   group: 'versatility', weight: 78, label: 'Generalista', icon: '🎭', color: '#5050a8',
    check: (_, sm) => [...sm.values()].filter(l => l >= 5).length >= 8  },
  { id: 'well_rounded', group: 'versatility', weight: 48, label: 'Completo',    icon: '🌀', color: '#7070c0',
    check: (_, sm) => [...sm.values()].filter(l => l >= 3).length >= 12 },

];

// ─── Tag resolver ─────────────────────────────────────────────────────────────

function computeTraitTags(entry: ArchetypeEntry, skillMap: Map<string, number>): TraitTag[] {
  const byGroup = new Map<string, TagDef>();
  for (const def of TAG_DEFS) {
    if (!def.check(entry, skillMap)) continue;
    const cur = byGroup.get(def.group);
    if (!cur || def.weight > cur.weight) byGroup.set(def.group, def);
  }
  return [...byGroup.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(({ id, label, icon, color }) => ({ id, label, icon, color }));
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export function resolveArchetype(entry: ArchetypeEntry): ArchetypeResult {
  const skillMap = parseSkillMap(entry.skills);
  const kpd      = entry.days > 0 ? entry.kills / entry.days : 0;
  const g = (name: string) => skillMap.get(name) ?? 0;
  const n = (val: number | null | undefined) => Math.max(0, val ?? 0);

  // ── Skill scores ─────────────────────────────────────────────────────────
  const combatScore  = g('Machado') + g('Contundente Longo') + g('Lâmina Longa') + g('Lança')
                     + g('Mira') + g('Contundente Curto') + g('Lâmina Curta') + g('Manutenção');
  const buildScore   = g('Marcenaria') + g('Soldagem') + g('Alvenaria') + g('Eletricidade') + g('Costura');
  const artisanScore = g('Forja') + g('Cerâmica') + g('Lascamento') + g('Entalhamento') + g('Vidraria');
  const huntScore    = g('Armadilhas') + g('Rastreamento') + g('Abate') + g('Pescaria');
  const stealthScore = g('Furtividade') + g('Pés Leves') + g('Agilidade');
  const medicScore   = g('Primeiros Socorros');
  const farmScore    = g('Agricultura') + g('Culinária') + g('Coleta') + g('Pecuária');
  const mechScore    = g('Mecânica');

  // ── Behavioral bonuses ───────────────────────────────────────────────────
  const huntBonus    = Math.min(n(entry.animals_killed) / 20, 5)
                     + Math.min(n(entry.fish_caught)    / 15, 3)
                     + Math.min(n(entry.animal_tracks)  / 15, 2);
  const farmBonus    = Math.min(n(entry.crops_harvested) / 40, 4)
                     + Math.min(n(entry.crops_planted)   / 30, 3)
                     + Math.min(n(entry.meals_cooked)    / 30, 2)
                     + Math.min((n(entry.eggs_collected) + n(entry.milk_produced)) / 15, 1);
  const buildBonus   = Math.min(n(entry.structures_built) / 20, 5)
                     + Math.min(n(entry.stone_structures)  / 15, 3);
  const exploreBonus = Math.min(n(entry.km_driven)      / 100, 6)
                     + Math.min(n(entry.cities_visited),        3)
                     + Math.min(n(entry.military_visited),      1);
  const artisanBonus = Math.min(n(entry.ceramic_items)    / 5,  4)
                     + Math.min(n(entry.forged_weapons)    / 3,  4)
                     + Math.min(n(entry.materials_crafted) / 50, 2);

  // ── Final specialty scores ────────────────────────────────────────────────
  const scores: Record<string, number> = {
    hunter:   huntScore   + huntBonus,
    builder:  buildScore  + buildBonus,
    artisan:  artisanScore + artisanBonus,
    farmer:   farmScore   + farmBonus,
    ghost:    stealthScore,
    explorer: mechScore   + exploreBonus,
  };

  const THRESHOLD = 5;
  const ranked   = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topKey   = ranked[0][0];
  const topScore = ranked[0][1];

  const isBerserker = (kpd >= 100 && combatScore >= 8)
                   || (kpd >= 60  && combatScore >= 6)
                   || (kpd >= 80);
  const isMedic = medicScore >= 8;

  let primaryKey:   string      = 'survivor';
  let secondaryKey: string|null = null;

  if (isMedic) {
    primaryKey   = 'medic';
    secondaryKey = isBerserker ? 'berserker' : topScore >= THRESHOLD ? topKey : null;
  } else if (isBerserker) {
    primaryKey   = 'berserker';
    secondaryKey = topScore >= THRESHOLD ? topKey : null;
  } else if (topScore >= THRESHOLD) {
    primaryKey = topKey;
    const runner      = ranked[1];
    const runnerScore = runner?.[1] ?? 0;
    if (runnerScore >= topScore * 0.70 && runnerScore >= THRESHOLD) secondaryKey = runner![0];
  }

  if (secondaryKey === primaryKey) secondaryKey = null;

  // ── Trait bars ────────────────────────────────────────────────────────────
  const combatTotal = combatScore + Math.min(kpd / 5, 10);
  const allBars: Omit<TraitBar, 'max'>[] = [
    { key: 'combat',   label: 'Combate',     icon: '🪓', score: combatTotal,      color: '#e04040' },
    { key: 'hunter',   label: 'Caça',        icon: '🏹', score: scores['hunter']!,   color: '#c8a84b' },
    { key: 'builder',  label: 'Construção',  icon: '🏰', score: scores['builder']!,  color: '#7ab8e0' },
    { key: 'artisan',  label: 'Artesanato',  icon: '🏺', score: scores['artisan']!,  color: '#d4875a' },
    { key: 'farmer',   label: 'Fazenda',     icon: '🌾', score: scores['farmer']!,   color: '#6ab840' },
    { key: 'explorer', label: 'Exploração',  icon: '🚗', score: scores['explorer']!, color: '#c87828' },
    { key: 'ghost',    label: 'Furtividade', icon: '🥷', score: scores['ghost']!,    color: '#9099a5' },
    { key: 'medic',    label: 'Medicina',    icon: '🩺', score: medicScore,          color: '#7ac050' },
  ];
  const sorted   = allBars.filter(b => b.score > 0).sort((a, b) => b.score - a.score);
  const maxScore = Math.max(sorted[0]?.score ?? 1, 1);
  const traits   = sorted.slice(0, 3).map(b => ({ ...b, max: maxScore }));

  // ── Tags ──────────────────────────────────────────────────────────────────
  const tags = computeTraitTags(entry, skillMap);

  return {
    primary:   ARCHETYPES[primaryKey]!,
    secondary: secondaryKey ? (ARCHETYPES[secondaryKey] ?? null) : null,
    traits,
    tags,
  };
}

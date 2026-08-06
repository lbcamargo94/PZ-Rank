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
  tags:      TraitTag[];
}

// ─── Archetypes ───────────────────────────────────────────────────────────────

export const ARCHETYPES: Record<string, Archetype> = {
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

// Requisitos de cada arquétipo (usado na modal de guia)
export interface ArchetypeGuide extends Archetype {
  how:    string[];   // como desbloquear (frases)
  skills: string[];   // skills relevantes
}

export const ARCHETYPE_GUIDE: ArchetypeGuide[] = [
  {
    ...ARCHETYPES['berserker']!,
    how: [
      'KPD (kills/dia) ≥ 80',
      'ou KPD ≥ 60 e soma de skills de combate ≥ 6',
      'ou KPD ≥ 100 e soma de skills de combate ≥ 8',
    ],
    skills: ['Machado', 'Contundente Longo/Curto', 'Lâmina Longa/Curta', 'Lança', 'Mira', 'Manutenção'],
  },
  {
    ...ARCHETYPES['medic']!,
    how: ['Primeiros Socorros ≥ nível 8'],
    skills: ['Primeiros Socorros'],
  },
  {
    ...ARCHETYPES['hunter']!,
    how: [
      'Soma de skills de caça ≥ 5',
      'Bônus: animais abatidos, peixes, rastros de animais',
    ],
    skills: ['Armadilhas', 'Rastreamento', 'Abate', 'Pescaria'],
  },
  {
    ...ARCHETYPES['builder']!,
    how: [
      'Soma de skills de construção ≥ 5',
      'Bônus: estruturas construídas, estruturas de pedra',
    ],
    skills: ['Marcenaria', 'Soldagem', 'Alvenaria', 'Eletricidade', 'Costura'],
  },
  {
    ...ARCHETYPES['artisan']!,
    how: [
      'Soma de skills de artesanato ≥ 5 (skills B42)',
      'Bônus: itens forjados, cerâmica, materiais artesanais',
    ],
    skills: ['Forja', 'Cerâmica', 'Lascamento', 'Entalhamento', 'Vidraria'],
  },
  {
    ...ARCHETYPES['farmer']!,
    how: [
      'Soma de skills de fazenda ≥ 5',
      'Bônus: colheitas, plantações, refeições, ovos e leite',
    ],
    skills: ['Agricultura', 'Culinária', 'Coleta', 'Pecuária'],
  },
  {
    ...ARCHETYPES['explorer']!,
    how: [
      'Mecânica + km dirigidos + cidades visitadas ≥ 5',
      'Bônus: km dirigidos, cidades, bases militares',
    ],
    skills: ['Mecânica'],
  },
  {
    ...ARCHETYPES['ghost']!,
    how: ['Soma de skills de furtividade ≥ 5'],
    skills: ['Furtividade', 'Pés Leves', 'Agilidade'],
  },
  {
    ...ARCHETYPES['survivor']!,
    how: ['Padrão — não qualifica para nenhum arquétipo acima'],
    skills: [],
  },
];

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

// ─── Tag definitions ──────────────────────────────────────────────────────────

interface TagDef {
  id:     string;
  label:  string;
  icon:   string;
  color:  string;
  group:  string;
  weight: number;
  desc:   string;   // condição legível para humanos
  check:  (e: ArchetypeEntry, sm: Map<string, number>) => boolean;
}

export interface TagTierInfo {
  id:     string;
  label:  string;
  icon:   string;
  color:  string;
  desc:   string;
  weight: number;
}

export interface TagGroupInfo {
  key:   string;
  label: string;
  tiers: TagTierInfo[];  // ordenado do menor para o maior tier
}

const GROUP_LABELS: Record<string, string> = {
  kills:       'Abates',
  survival:    'Sobrevivência',
  kpd:         'Taxa de Kills (KPD)',
  sleep:       'Privação de Sono',
  driving:     'Pilotagem',
  cities:      'Cidades Exploradas',
  military:    'Bases Militares',
  hunting:     'Caça',
  fishing:     'Pesca',
  tracking:    'Rastreamento',
  building:    'Construção',
  stone:       'Construção Primitiva',
  farming:     'Agricultura',
  cooking:     'Culinária',
  livestock:   'Pecuária',
  forging:     'Forja',
  pottery:     'Cerâmica',
  crafting:    'Artesanato Geral',
  looting:     'Saque',
  reading:     'Leitura',
  woodcutting: 'Corte de Árvores',
  water:       'Coleta de Água',
  skill_peak:  'Maestria em Skills',
  versatility: 'Versatilidade',
};

const TAG_DEFS: TagDef[] = [

  // ── Kills ───────────────────────────────────────────────────────────────
  { id: 'fighter',     group: 'kills', weight: 35,  icon: '⚔️',  color: '#e05858', label: 'Combatente',     desc: '500 abates',       check: e => e.kills >= 500   },
  { id: 'executioner', group: 'kills', weight: 60,  icon: '🔪',  color: '#e04040', label: 'Carrasco',       desc: '3.000 abates',     check: e => e.kills >= 3000  },
  { id: 'terminator',  group: 'kills', weight: 80,  icon: '💀',  color: '#c02020', label: 'Exterminador',   desc: '10.000 abates',    check: e => e.kills >= 10000 },
  { id: 'apocalypse',  group: 'kills', weight: 100, icon: '☠️',  color: '#8b0000', label: 'Apocalipse',     desc: '50.000 abates',    check: e => e.kills >= 50000 },

  // ── Sobrevivência ─────────────────────────────────────────────────────────
  { id: 'veteran',  group: 'survival', weight: 45, icon: '🏅',  color: '#a08030', label: 'Veterano',       desc: '90 dias',          check: e => e.days >= 90  },
  { id: 'war_vet',  group: 'survival', weight: 70, icon: '🎖️', color: '#c8a84b', label: 'Vet. de Guerra', desc: '180 dias',         check: e => e.days >= 180 },
  { id: 'legend',   group: 'survival', weight: 95, icon: '⭐',  color: '#ffd700', label: 'Lendário',       desc: '365 dias',         check: e => e.days >= 365 },

  // ── KPD ──────────────────────────────────────────────────────────────────
  { id: 'relentless',      group: 'kpd', weight: 40, icon: '😤', color: '#c04040', label: 'Implacável',        desc: 'KPD ≥ 30/dia',  check: e => e.days > 0 && (e.kills / e.days) >= 30  },
  { id: 'aggressive',      group: 'kpd', weight: 65, icon: '🔥', color: '#d02020', label: 'Agressivo',         desc: 'KPD ≥ 80/dia',  check: e => e.days > 0 && (e.kills / e.days) >= 80  },
  { id: 'killing_machine', group: 'kpd', weight: 92, icon: '🌪️', color: '#b00000', label: 'Máquina de Matar', desc: 'KPD ≥ 200/dia', check: e => e.days > 0 && (e.kills / e.days) >= 200 },

  // ── Sono ─────────────────────────────────────────────────────────────────
  { id: 'night_owl',         group: 'sleep', weight: 30, icon: '🦉', color: '#9080c0', label: 'Noturno',         desc: '24h sem dormir',  check: e => (e.hours_without_sleep ?? 0) >= 24  },
  { id: 'insomniac',         group: 'sleep', weight: 55, icon: '😴', color: '#7060b0', label: 'Insone',          desc: '72h sem dormir',  check: e => (e.hours_without_sleep ?? 0) >= 72  },
  { id: 'chronic_insomniac', group: 'sleep', weight: 85, icon: '🌙', color: '#4a2890', label: 'Insone Crônico',  desc: '168h sem dormir', check: e => (e.hours_without_sleep ?? 0) >= 168 },

  // ── Direção ───────────────────────────────────────────────────────────────
  { id: 'road_nomad', group: 'driving', weight: 35, icon: '🛣️',  color: '#a07030', label: 'Nômade',         desc: '80 km dirigidos',    check: e => (e.km_driven ?? 0) >= 80   },
  { id: 'driver',     group: 'driving', weight: 62, icon: '🚗',  color: '#c87828', label: 'Motorista',      desc: '300 km dirigidos',   check: e => (e.km_driven ?? 0) >= 300  },
  { id: 'road_king',  group: 'driving', weight: 92, icon: '🏎️', color: '#e07020', label: 'Rei da Estrada', desc: '1.000 km dirigidos', check: e => (e.km_driven ?? 0) >= 1000 },

  // ── Cidades ───────────────────────────────────────────────────────────────
  { id: 'explorer_tag', group: 'cities', weight: 55, icon: '🧭', color: '#30a8b8', label: 'Explorador',  desc: '3 cidades visitadas', check: e => (e.cities_visited ?? 0) >= 3 },
  { id: 'cartographer', group: 'cities', weight: 85, icon: '🗺️', color: '#2090a0', label: 'Cartógrafo',  desc: '7 cidades visitadas', check: e => (e.cities_visited ?? 0) >= 7 },

  // ── Militar ───────────────────────────────────────────────────────────────
  { id: 'soldier',  group: 'military', weight: 48, icon: '🎯', color: '#5a8a5a', label: 'Soldado',   desc: '1 base militar',  check: e => (e.military_visited ?? 0) >= 1 },
  { id: 'commando', group: 'military', weight: 72, icon: '🪖', color: '#4a7a4a', label: 'Commando',  desc: '3 bases militares', check: e => (e.military_visited ?? 0) >= 3 },

  // ── Caça ─────────────────────────────────────────────────────────────────
  { id: 'hunter_tag',    group: 'hunting', weight: 40, icon: '🐗', color: '#c8a84b', label: 'Caçador',         desc: '50 animais',  check: e => (e.animals_killed ?? 0) >= 50   },
  { id: 'poacher',       group: 'hunting', weight: 65, icon: '🏹', color: '#a07020', label: 'Caçador Furtivo', desc: '200 animais', check: e => (e.animals_killed ?? 0) >= 200  },
  { id: 'apex_predator', group: 'hunting', weight: 90, icon: '🦁', color: '#8a5010', label: 'Predador Alfa',   desc: '500 animais', check: e => (e.animals_killed ?? 0) >= 500  },

  // ── Pesca ─────────────────────────────────────────────────────────────────
  { id: 'fisherman_tag',    group: 'fishing', weight: 50, icon: '🎣', color: '#2878b8', label: 'Pescador',         desc: '50 peixes',  check: e => (e.fish_caught ?? 0) >= 50  },
  { id: 'master_fisherman', group: 'fishing', weight: 80, icon: '🐠', color: '#1060a0', label: 'Mestre Pescador',  desc: '200 peixes', check: e => (e.fish_caught ?? 0) >= 200 },

  // ── Rastreamento ──────────────────────────────────────────────────────────
  { id: 'tracker_tag',    group: 'tracking', weight: 48, icon: '🐾', color: '#9a7040', label: 'Rastreador',         desc: '30 rastros',  check: e => (e.animal_tracks ?? 0) >= 30  },
  { id: 'master_tracker', group: 'tracking', weight: 78, icon: '🐾', color: '#7a5020', label: 'Rastreador Mestre',  desc: '100 rastros', check: e => (e.animal_tracks ?? 0) >= 100 },

  // ── Construção ────────────────────────────────────────────────────────────
  { id: 'handyman',       group: 'building', weight: 35, icon: '🔧', color: '#6898d0', label: 'Faz-tudo',           desc: '30 estruturas',  check: e => (e.structures_built ?? 0) >= 30  },
  { id: 'builder_tag',    group: 'building', weight: 62, icon: '🏗️', color: '#4a80be', label: 'Construtor',         desc: '100 estruturas', check: e => (e.structures_built ?? 0) >= 100 },
  { id: 'master_builder', group: 'building', weight: 90, icon: '🏰', color: '#2a60a0', label: 'Mestre Construtor',  desc: '500 estruturas', check: e => (e.structures_built ?? 0) >= 500 },

  // ── Pedra ─────────────────────────────────────────────────────────────────
  { id: 'stonemason', group: 'stone', weight: 68, icon: '🪨', color: '#6a6a80', label: 'Pedreiro', desc: '50 estruturas de pedra', check: e => (e.stone_structures ?? 0) >= 50 },

  // ── Agricultura ───────────────────────────────────────────────────────────
  { id: 'planter',    group: 'farming', weight: 30, icon: '🌿', color: '#6ab840', label: 'Plantador',  desc: '30 plantações',   check: e => (e.crops_planted   ?? 0) >= 30  },
  { id: 'farmer_tag', group: 'farming', weight: 55, icon: '🌾', color: '#4a9830', label: 'Fazendeiro', desc: '100 colheitas',   check: e => (e.crops_harvested ?? 0) >= 100 },
  { id: 'agronomist', group: 'farming', weight: 85, icon: '🌱', color: '#208020', label: 'Agrônomo',   desc: '500 colheitas',   check: e => (e.crops_harvested ?? 0) >= 500 },

  // ── Culinária ─────────────────────────────────────────────────────────────
  { id: 'cook_tag',  group: 'cooking', weight: 32, icon: '🍳', color: '#f09050', label: 'Cozinheiro',    desc: '15 refeições',  check: e => (e.meals_cooked ?? 0) >= 15  },
  { id: 'chef_tag',  group: 'cooking', weight: 58, icon: '👨‍🍳',color: '#f07030', label: 'Chef',          desc: '50 refeições',  check: e => (e.meals_cooked ?? 0) >= 50  },
  { id: 'star_chef', group: 'cooking', weight: 88, icon: '⭐', color: '#e05010', label: 'Chef Estrelado', desc: '200 refeições', check: e => (e.meals_cooked ?? 0) >= 200 },

  // ── Pecuária ──────────────────────────────────────────────────────────────
  { id: 'farmhand', group: 'livestock', weight: 42, icon: '🐔', color: '#b09040', label: 'Vaqueiro',    desc: '30 (ovos + leites)',  check: e => (e.eggs_collected ?? 0) + (e.milk_produced ?? 0) >= 30  },
  { id: 'rancher',  group: 'livestock', weight: 72, icon: '🐄', color: '#a08030', label: 'Pecuarista',  desc: '100 (ovos + leites)', check: e => (e.eggs_collected ?? 0) + (e.milk_produced ?? 0) >= 100 },

  // ── Forja ─────────────────────────────────────────────────────────────────
  { id: 'blacksmith',   group: 'forging', weight: 62, icon: '🔨', color: '#c06030', label: 'Ferreiro',         desc: '20 armas forjadas',  check: e => (e.forged_weapons ?? 0) >= 20  },
  { id: 'master_smith', group: 'forging', weight: 90, icon: '⚒️', color: '#a04010', label: 'Mestre Ferreiro',  desc: '100 armas forjadas', check: e => (e.forged_weapons ?? 0) >= 100 },

  // ── Cerâmica ──────────────────────────────────────────────────────────────
  { id: 'potter_tag',    group: 'pottery', weight: 52, icon: '🏺', color: '#c05040', label: 'Oleiro',     desc: '30 itens de cerâmica',  check: e => (e.ceramic_items ?? 0) >= 30  },
  { id: 'master_potter', group: 'pottery', weight: 82, icon: '🏺', color: '#b04030', label: 'Ceramista',  desc: '100 itens de cerâmica', check: e => (e.ceramic_items ?? 0) >= 100 },

  // ── Artesanato geral ──────────────────────────────────────────────────────
  { id: 'craftsman_tag', group: 'crafting', weight: 45, icon: '🛠️', color: '#a86040', label: 'Artesão',      desc: '50 materiais artesanais',  check: e => (e.materials_crafted ?? 0) >= 50  },
  { id: 'artisan_tag',   group: 'crafting', weight: 75, icon: '🛠️', color: '#985030', label: 'Grande Artesão', desc: '200 materiais artesanais', check: e => (e.materials_crafted ?? 0) >= 200 },

  // ── Saque ─────────────────────────────────────────────────────────────────
  { id: 'scavenger',    group: 'looting', weight: 30, icon: '🗑️', color: '#807040', label: 'Catador',       desc: '20 casas saqueadas',  check: e => (e.houses_looted ?? 0) >= 20  },
  { id: 'looter',       group: 'looting', weight: 58, icon: '🏚️', color: '#a06020', label: 'Saqueador',     desc: '80 casas saqueadas',  check: e => (e.houses_looted ?? 0) >= 80  },
  { id: 'king_of_loot', group: 'looting', weight: 88, icon: '💰', color: '#b07010', label: 'Rei do Saque',  desc: '300 casas saqueadas', check: e => (e.houses_looted ?? 0) >= 300 },

  // ── Leitura ───────────────────────────────────────────────────────────────
  { id: 'literate',    group: 'reading', weight: 55, icon: '📖', color: '#8040c0', label: 'Letrado',    desc: '15 livros lidos', check: e => (e.books_read ?? 0) >= 15 },
  { id: 'bibliophile', group: 'reading', weight: 85, icon: '📚', color: '#6020a0', label: 'Bibliófilo', desc: '50 livros lidos', check: e => (e.books_read ?? 0) >= 50 },

  // ── Lenhador ──────────────────────────────────────────────────────────────
  { id: 'woodsman',        group: 'woodcutting', weight: 52, icon: '🪵', color: '#6a3810', label: 'Lenhador',        desc: '150 árvores',  check: e => (e.trees_cut ?? 0) >= 150 },
  { id: 'woodsman_master', group: 'woodcutting', weight: 80, icon: '🌲', color: '#4a2808', label: 'Lenhador Mestre', desc: '500 árvores',  check: e => (e.trees_cut ?? 0) >= 500 },

  // ── Água ──────────────────────────────────────────────────────────────────
  { id: 'water_guardian', group: 'water', weight: 72, icon: '💧', color: '#1870b0', label: 'Guardião da Água', desc: '200 litros coletados', check: e => (e.water_collected ?? 0) >= 200 },

  // ── Maestria em skills ────────────────────────────────────────────────────
  { id: 'specialist',   group: 'skill_peak', weight: 65, icon: '🎯', color: '#c08000', label: 'Especialista',    desc: 'Qualquer skill ≥ nível 8',  check: (_, sm) => [...sm.values()].some(l => l >= 8)  },
  { id: 'skill_master', group: 'skill_peak', weight: 92, icon: '🏆', color: '#d4a000', label: 'Mestre Absoluto', desc: 'Qualquer skill ≥ nível 10', check: (_, sm) => [...sm.values()].some(l => l >= 10) },

  // ── Versatilidade ─────────────────────────────────────────────────────────
  { id: 'well_rounded', group: 'versatility', weight: 48, icon: '🌀', color: '#7070c0', label: 'Completo',    desc: '12+ skills ≥ nível 3', check: (_, sm) => [...sm.values()].filter(l => l >= 3).length >= 12 },
  { id: 'generalist',   group: 'versatility', weight: 78, icon: '🎭', color: '#5050a8', label: 'Generalista', desc: '8+ skills ≥ nível 5',  check: (_, sm) => [...sm.values()].filter(l => l >= 5).length >= 8  },
];

// Agrupamento exportado para a modal de guia
export const TAG_GROUPS_INFO: TagGroupInfo[] = (() => {
  const map = new Map<string, TagGroupInfo>();
  for (const def of TAG_DEFS) {
    if (!map.has(def.group)) {
      map.set(def.group, {
        key:   def.group,
        label: GROUP_LABELS[def.group] ?? def.group,
        tiers: [],
      });
    }
    map.get(def.group)!.tiers.push({
      id: def.id, label: def.label, icon: def.icon,
      color: def.color, desc: def.desc, weight: def.weight,
    });
  }
  for (const g of map.values()) g.tiers.sort((a, b) => a.weight - b.weight);
  return [...map.values()];
})();

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

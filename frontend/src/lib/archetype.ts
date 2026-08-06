import { parseSkillMap } from './skills';
import type { Entry } from '../types';

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

export interface ArchetypeResult {
  primary:   Archetype;
  secondary: Archetype | null;  // exibido quando 2º score >= 70% do 1º
  traits:    TraitBar[];        // top 3 categorias do jogador
}

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

type ArchetypeEntry = Pick<Entry, 'kills' | 'days' | 'skills'> & {
  animals_killed?:    number | null;
  fish_caught?:       number | null;
  animal_tracks?:     number | null;
  structures_built?:  number | null;
  stone_structures?:  number | null;
  crops_harvested?:   number | null;
  crops_planted?:     number | null;
  meals_cooked?:      number | null;
  eggs_collected?:    number | null;
  milk_produced?:     number | null;
  km_driven?:         number | null;
  cities_visited?:    number | null;
  military_visited?:  number | null;
  forged_weapons?:    number | null;
  ceramic_items?:     number | null;
  materials_crafted?: number | null;
};

export function resolveArchetype(entry: ArchetypeEntry): ArchetypeResult {
  const skillMap = parseSkillMap(entry.skills);
  const kpd      = entry.days > 0 ? entry.kills / entry.days : 0;
  const g = (name: string) => skillMap.get(name) ?? 0;
  const n = (val: number | null | undefined) => Math.max(0, val ?? 0);

  // ── Skill scores ─────────────────────────────────────────────────────────
  const combatScore  = g('Machado') + g('Contundente Longo') + g('Lâmina Longa') + g('Lança')
                     + g('Mira') + g('Contundente Curto') + g('Lâmina Curta') + g('Manutenção');

  // Construtor: estruturas físicas e infraestrutura
  const buildScore   = g('Marcenaria') + g('Soldagem') + g('Alvenaria')
                     + g('Eletricidade') + g('Costura');

  // Artesão: crafting primitivo e avançado (skills exclusivamente B42)
  const artisanScore = g('Forja') + g('Cerâmica') + g('Lascamento')
                     + g('Entalhamento') + g('Vidraria');

  const huntScore    = g('Armadilhas') + g('Rastreamento') + g('Abate') + g('Pescaria');
  const stealthScore = g('Furtividade') + g('Pés Leves') + g('Agilidade');
  const medicScore   = g('Primeiros Socorros');
  const farmScore    = g('Agricultura') + g('Culinária') + g('Coleta') + g('Pecuária');
  const mechScore    = g('Mecânica');

  // ── Behavioral bonuses (stats do mod — PZRX3 a PZRX6) ───────────────────
  // Cada bônus aporta no máximo ~10 pontos para equilibrar com as skills.
  const huntBonus    = Math.min(n(entry.animals_killed) / 20, 5)
                     + Math.min(n(entry.fish_caught)    / 15, 3)
                     + Math.min(n(entry.animal_tracks)  / 15, 2);

  const farmBonus    = Math.min(n(entry.crops_harvested) / 40,  4)
                     + Math.min(n(entry.crops_planted)   / 30,  3)
                     + Math.min(n(entry.meals_cooked)    / 30,  2)
                     + Math.min((n(entry.eggs_collected) + n(entry.milk_produced)) / 15, 1);

  const buildBonus   = Math.min(n(entry.structures_built) / 20, 5)
                     + Math.min(n(entry.stone_structures)  / 15, 3);

  const exploreBonus = Math.min(n(entry.km_driven)      / 100, 6)
                     + Math.min(n(entry.cities_visited),        3)
                     + Math.min(n(entry.military_visited),      1);

  const artisanBonus = Math.min(n(entry.ceramic_items)    / 5,  4)
                     + Math.min(n(entry.forged_weapons)    / 3,  4)
                     + Math.min(n(entry.materials_crafted) / 50, 2);

  // ── Scores finais por arquétipo de especialidade ──────────────────────────
  const scores: Record<string, number> = {
    hunter:   huntScore   + huntBonus,
    builder:  buildScore  + buildBonus,
    artisan:  artisanScore + artisanBonus,
    farmer:   farmScore   + farmBonus,
    ghost:    stealthScore,
    explorer: mechScore   + exploreBonus,
  };

  const THRESHOLD = 5; // score mínimo para vencer

  // ── Seleção do arquétipo primário e secundário ────────────────────────────
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
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
    secondaryKey = isBerserker ? 'berserker'
                 : topScore >= THRESHOLD ? topKey : null;
  } else if (isBerserker) {
    primaryKey   = 'berserker';
    secondaryKey = topScore >= THRESHOLD ? topKey : null;
  } else if (topScore >= THRESHOLD) {
    primaryKey = topKey;
    const runner      = ranked[1];
    const runnerScore = runner?.[1] ?? 0;
    if (runnerScore >= topScore * 0.70 && runnerScore >= THRESHOLD) {
      secondaryKey = runner![0];
    }
  }

  // Evita mostrar arquétipo secundário igual ao primário
  if (secondaryKey === primaryKey) secondaryKey = null;

  // ── Barras de traço (top 3 categorias do jogador) ────────────────────────
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

  const sorted = allBars.filter(b => b.score > 0).sort((a, b) => b.score - a.score);
  const maxScore = Math.max(sorted[0]?.score ?? 1, 1);
  const traits: TraitBar[] = sorted.slice(0, 3).map(b => ({ ...b, max: maxScore }));

  return {
    primary:   ARCHETYPES[primaryKey]!,
    secondary: secondaryKey ? (ARCHETYPES[secondaryKey] ?? null) : null,
    traits,
  };
}
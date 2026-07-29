import { parseSkillMap } from './skills';
import type { Entry } from '../types';

export interface Archetype {
  id:    string;
  name:  string;
  icon:  string;
  desc:  string;
  color: string;
}

const ARCHETYPES: Record<string, Archetype> = {
  berserker: { id: 'berserker', name: 'Berserker',   icon: '🪓', color: '#e04040', desc: 'Combatente nato. Deixa um rastro de mortos por onde passa.'     },
  hunter:    { id: 'hunter',    name: 'Caçador',      icon: '🏹', color: '#c8a84b', desc: 'Mestre das armadilhas e do rastreamento. A floresta é seu lar.' },
  builder:   { id: 'builder',   name: 'Construtor',   icon: '🏰', color: '#7ab8e0', desc: 'Ergue bases onde outros apenas sobrevivem.'                    },
  explorer:  { id: 'explorer',  name: 'Explorador',   icon: '🚗', color: '#c87828', desc: 'Não para de se mover. Conhece cada rua do mapa.'               },
  medic:     { id: 'medic',     name: 'Médico',       icon: '🩺', color: '#7ac050', desc: 'Mantém o grupo de pé mesmo nas piores situações.'              },
  farmer:    { id: 'farmer',    name: 'Fazendeiro',   icon: '🌾', color: '#6ab840', desc: 'Encontrou sustento onde ninguém mais encontrou.'               },
  ghost:     { id: 'ghost',     name: 'Fantasma',     icon: '🥷', color: '#9099a5', desc: 'Passa despercebido. Os zumbis nem sabem que ele existe.'       },
  survivor:  { id: 'survivor',  name: 'Sobrevivente', icon: '🛡️', color: '#b0a890', desc: 'Equilibrado e resiliente. Ainda está de pé — isso já é muito.' },
};

export function resolveArchetype(entry: Pick<Entry, 'kills' | 'days' | 'skills'>): Archetype {
  const skillMap = parseSkillMap(entry.skills);
  const kpd      = entry.days > 0 ? entry.kills / entry.days : 0;

  const g = (name: string) => skillMap.get(name) ?? 0;

  const combatScore  = g('Machado') + g('Contundente Longo') + g('Lâmina Longa') + g('Lança') + g('Mira') + g('Contundente Curto') + g('Lâmina Curta');
  const buildScore   = g('Marcenaria') + g('Soldagem') + g('Alvenaria') + g('Eletricidade') + g('Forja');
  const huntScore    = g('Armadilhas') + g('Rastreamento') + g('Abate') + g('Pescaria');
  const stealthScore = g('Furtividade') + g('Pés Leves') + g('Agilidade');
  const medicScore   = g('Primeiros Socorros');
  const farmScore    = g('Agricultura') + g('Culinária') + g('Coleta') + g('Pecuária');
  const mechScore    = g('Mecânica');

  // Berserker: muitas kills por dia E habilidades de combate
  if (kpd >= 100 && combatScore >= 8) return ARCHETYPES.berserker;
  if (kpd >= 60  && combatScore >= 6) return ARCHETYPES.berserker;

  // Médico tem precedência alta quando especializado
  if (medicScore >= 8) return ARCHETYPES.medic;

  // Domínio por maior pontuação de especialidade
  const ranking = [
    { key: 'builder',  val: buildScore   },
    { key: 'hunter',   val: huntScore    },
    { key: 'farmer',   val: farmScore    },
    { key: 'ghost',    val: stealthScore },
    { key: 'explorer', val: mechScore    },
  ].sort((a, b) => b.val - a.val);

  const top = ranking[0];
  if (top.val >= 6) return ARCHETYPES[top.key];

  // Berserker por kills mesmo sem skills de combate altas
  if (kpd >= 80) return ARCHETYPES.berserker;

  return ARCHETYPES.survivor;
}

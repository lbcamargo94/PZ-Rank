export interface SkillDef {
  id:       string;
  name:     string;
  category: string;
}

// IDs usam a nomenclatura B42.19 (Perks enum, via perk:getType() — fonte: ISRadioInteractions.lua).
// B41→B42: Lightfooted→Lightfoot, Sneaking→Sneak, LongBlunt→Blunt,
// ShortBlunt→SmallBlunt, ShortBlade→SmallBlade, Carpentry→Woodwork,
// Electrical→Electricity, Foraging→PlantScavenging, FirstAid→Doctor,
// Agriculture→Farming, Knapping→FlintKnapping, AnimalCare→Husbandry.
export const SKILLS: SkillDef[] = [
  // Física
  { id: 'Fitness',          name: 'Aptidão Física',      category: 'Física' },
  { id: 'Strength',         name: 'Força',               category: 'Física' },
  { id: 'Sprinting',        name: 'Corrida',             category: 'Física' },
  { id: 'Lightfoot',        name: 'Pés Leves',           category: 'Física' },
  { id: 'Nimble',           name: 'Agilidade',           category: 'Física' },
  { id: 'Sneak',            name: 'Furtividade',         category: 'Física' },
  // Combate
  { id: 'Axe',              name: 'Machado',             category: 'Combate' },
  { id: 'Blunt',            name: 'Contundente Longo',   category: 'Combate' },
  { id: 'SmallBlunt',       name: 'Contundente Curto',   category: 'Combate' },
  { id: 'LongBlade',        name: 'Lâmina Longa',        category: 'Combate' },
  { id: 'SmallBlade',       name: 'Lâmina Curta',        category: 'Combate' },
  { id: 'Spear',            name: 'Lança',               category: 'Combate' },
  { id: 'Maintenance',      name: 'Manutenção',          category: 'Combate' },
  // Armas de Fogo
  { id: 'Aiming',           name: 'Mira',                category: 'Armas de Fogo' },
  { id: 'Reloading',        name: 'Recarga',             category: 'Armas de Fogo' },
  // Profissões
  { id: 'Woodwork',         name: 'Marcenaria',          category: 'Profissões' },
  { id: 'Electricity',      name: 'Eletricidade',        category: 'Profissões' },
  { id: 'MetalWelding',     name: 'Soldagem',            category: 'Profissões' },
  { id: 'Mechanics',        name: 'Mecânica',            category: 'Profissões' },
  { id: 'Tailoring',        name: 'Costura',             category: 'Profissões' },
  // Sobrevivência
  { id: 'Cooking',          name: 'Culinária',           category: 'Sobrevivência' },
  { id: 'Farming',          name: 'Agricultura',         category: 'Sobrevivência' },
  { id: 'Doctor',           name: 'Primeiros Socorros',  category: 'Sobrevivência' },
  { id: 'Fishing',          name: 'Pescaria',            category: 'Sobrevivência' },
  { id: 'Trapping',         name: 'Armadilhas',          category: 'Sobrevivência' },
  { id: 'PlantScavenging',  name: 'Coleta',              category: 'Sobrevivência' },
  // Build 42
  { id: 'FlintKnapping',    name: 'Lascamento',          category: 'Build 42' },
  { id: 'Carving',          name: 'Entalhamento',        category: 'Build 42' },
  { id: 'Masonry',          name: 'Alvenaria',           category: 'Build 42' },
  { id: 'Pottery',          name: 'Cerâmica',            category: 'Build 42' },
  { id: 'Blacksmith',       name: 'Forja',               category: 'Build 42' },
  { id: 'Glassmaking',      name: 'Vidraria',            category: 'Build 42' },
  { id: 'Husbandry',        name: 'Pecuária',            category: 'Build 42' },
  { id: 'Butchering',       name: 'Abate',               category: 'Build 42' },
  { id: 'Tracking',         name: 'Rastreamento',        category: 'Build 42' },
];

export const TOTAL_SKILLS = SKILLS.length;
export const MAX_SKILL_LEVEL = 10;

const U = '?';

// Normalization map: any historical variant → canonical PT-BR name
const SKILL_FIX: Record<string, string> = {
  // B42 IDs → PT-BR (gerado a partir da lista acima)
  ...Object.fromEntries(SKILLS.map(s => [s.id, s.name])),
  // B41 IDs → PT-BR (backward compat: entradas antigas armazenadas com ID inglês B41)
  Lightfooted:          'Pés Leves',
  Sneaking:             'Furtividade',
  LongBlunt:            'Contundente Longo',
  ShortBlunt:           'Contundente Curto',
  ShortBlade:           'Lâmina Curta',
  Carpentry:            'Marcenaria',
  Electrical:           'Eletricidade',
  Foraging:             'Coleta',               // B41 ID → PlantScavenging B42
  Survivalist:          'Coleta',               // nome B42 incorreto anterior → correto
  FirstAid:             'Primeiros Socorros',   // B41 ID → Doctor B42
  Agriculture:          'Agricultura',
  Knapping:             'Lascamento',
  AnimalCare:           'Pecuária',
  // Nomes PT-BR antigos → PT-BR novo (backward compat: entradas decodificadas antes do fix)
  'Carpintaria':        'Marcenaria',
  'Sobrevivência':      'Coleta',               // nome antigo do skill PlantScavenging
  'Coleta':             'Coleta',               // identidade — mantido para clareza
  'Medicina':           'Primeiros Socorros',   // nome antigo do Doctor
  'Condicionamento':    'Aptidão Física',       // nome antigo do Fitness
  'Ferraria':           'Forja',                // nome antigo do Blacksmith
  'Pesca':              'Pescaria',             // nome antigo do Fishing
  'Cuidado Animal':     'Pecuária',
  // Old abbreviations
  'Cont. Longo':        'Contundente Longo',
  'Cont. Curto':        'Contundente Curto',
  // U+FFFD era
  [`Cer${U}mica`]:       'Cerâmica',
  [`Culin${U}ria`]:      'Culinária',
  [`For${U}a`]:          'Força',
  [`Lan${U}a`]:          'Lança',
  [`L${U}mina Longa`]:   'Lâmina Longa',
  [`L${U}mina Curta`]:   'Lâmina Curta',
  [`Manuten${U}${U}o`]:  'Manutenção',
  [`Mec${U}nica`]:       'Mecânica',
  [`P${U}s Leves`]:      'Pés Leves',
  // ý-corruption era
  'Cesýmica':            'Cerâmica',
  'Culiiýria':           'Culinária',
  'Fouýa':               'Força',
  'Lanýa':               'Lança',
  'Lýmina Longa':        'Lâmina Longa',
  'Lýmina Curta':        'Lâmina Curta',
  'Manutenâýo':          'Manutenção',
  'Mebýnica':            'Mecânica',
};

// Name lookup by PT-BR name → SkillDef
const SKILL_BY_NAME = new Map(SKILLS.map(s => [s.name, s]));

/**
 * Parses the skills CSV string and returns a Map of canonical PT-BR name → level.
 * All 35 skills are always present; missing ones default to level 0.
 */
export function parseSkillMap(skillsStr: string | null): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of SKILLS) map.set(s.name, 0);

  if (!skillsStr) return map;

  for (const s of skillsStr.split(',')) {
    const t = s.trim();
    if (!t) continue;
    const lastSpace = t.lastIndexOf(' ');
    if (lastSpace === -1) continue;
    const rawName = t.slice(0, lastSpace);
    const canonical = SKILL_FIX[rawName] ?? rawName;
    const level = parseInt(t.slice(lastSpace + 1), 10);
    if (!isNaN(level) && SKILL_BY_NAME.has(canonical)) {
      map.set(canonical, level);
    }
  }

  return map;
}

// Unique ordered categories
const _catOrder = SKILLS.reduce<string[]>((acc, s) => {
  if (!acc.includes(s.category)) acc.push(s.category);
  return acc;
}, []);

export const SKILL_CATEGORIES: { label: string; skills: SkillDef[] }[] =
  _catOrder.map(label => ({
    label,
    skills: SKILLS.filter(s => s.category === label),
  }));

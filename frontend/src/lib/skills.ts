export interface SkillDef {
  id:       string;
  name:     string;
  category: string;
}

export const SKILLS: SkillDef[] = [
  // Física
  { id: 'Fitness',      name: 'Condicionamento',    category: 'Física' },
  { id: 'Strength',     name: 'Força',              category: 'Física' },
  { id: 'Sprinting',    name: 'Corrida',            category: 'Física' },
  { id: 'Lightfooted',  name: 'Pés Leves',          category: 'Física' },
  { id: 'Nimble',       name: 'Agilidade',          category: 'Física' },
  { id: 'Sneaking',     name: 'Furtividade',        category: 'Física' },
  // Combate
  { id: 'Axe',          name: 'Machado',            category: 'Combate' },
  { id: 'LongBlunt',    name: 'Contundente Longo',  category: 'Combate' },
  { id: 'ShortBlunt',   name: 'Contundente Curto',  category: 'Combate' },
  { id: 'LongBlade',    name: 'Lâmina Longa',       category: 'Combate' },
  { id: 'ShortBlade',   name: 'Lâmina Curta',       category: 'Combate' },
  { id: 'Spear',        name: 'Lança',              category: 'Combate' },
  { id: 'Maintenance',  name: 'Manutenção',         category: 'Combate' },
  // Armas de Fogo
  { id: 'Aiming',       name: 'Mira',               category: 'Armas de Fogo' },
  { id: 'Reloading',    name: 'Recarga',            category: 'Armas de Fogo' },
  // Profissões
  { id: 'Carpentry',    name: 'Carpintaria',        category: 'Profissões' },
  { id: 'Electrical',   name: 'Eletricidade',       category: 'Profissões' },
  { id: 'MetalWelding', name: 'Soldagem',           category: 'Profissões' },
  { id: 'Mechanics',    name: 'Mecânica',           category: 'Profissões' },
  { id: 'Tailoring',    name: 'Costura',            category: 'Profissões' },
  // Sobrevivência
  { id: 'Cooking',      name: 'Culinária',          category: 'Sobrevivência' },
  { id: 'Agriculture',  name: 'Agricultura',        category: 'Sobrevivência' },
  { id: 'FirstAid',     name: 'Primeiros Socorros', category: 'Sobrevivência' },
  { id: 'Fishing',      name: 'Pesca',              category: 'Sobrevivência' },
  { id: 'Trapping',     name: 'Armadilhas',         category: 'Sobrevivência' },
  { id: 'Foraging',     name: 'Coleta',             category: 'Sobrevivência' },
  // Build 42
  { id: 'Knapping',     name: 'Lascamento',         category: 'Build 42' },
  { id: 'Carving',      name: 'Entalhamento',       category: 'Build 42' },
  { id: 'Masonry',      name: 'Alvenaria',          category: 'Build 42' },
  { id: 'Pottery',      name: 'Cerâmica',           category: 'Build 42' },
  { id: 'Blacksmith',   name: 'Ferraria',           category: 'Build 42' },
  { id: 'Glassmaking',  name: 'Vidraria',           category: 'Build 42' },
  { id: 'AnimalCare',   name: 'Cuidado Animal',     category: 'Build 42' },
  { id: 'Butchering',   name: 'Abate',              category: 'Build 42' },
  { id: 'Tracking',     name: 'Rastreamento',       category: 'Build 42' },
];

export const TOTAL_SKILLS = SKILLS.length;
export const MAX_SKILL_LEVEL = 10;

const U = '�';

// Normalization map: any historical variant → canonical PT-BR name
const SKILL_FIX: Record<string, string> = {
  // English IDs (mod v1.7+)
  ...Object.fromEntries(SKILLS.map(s => [s.id, s.name])),
  // Old abbreviations
  'Cont. Longo': 'Contundente Longo',
  'Cont. Curto': 'Contundente Curto',
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

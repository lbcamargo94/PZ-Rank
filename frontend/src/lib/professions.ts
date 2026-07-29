const _profImgs = import.meta.glob<string>(
  '../../assets/profissoes/*.png',
  { eager: true, query: '?url', import: 'default' },
);

// Maps profession names (as returned by getUIName() in PTBR or EN) to image file basenames.
// Needed because the asset filenames don't always match the PTBR translation strings.
const PROF_NAME_TO_IMG: Record<string, string> = {
  // PTBR names that differ from the image file name
  'Médico':        'Doutor',
  'Pedreiro':      'Construtor Civil',
  'Guia de Pesca': 'Pescador',
  'Soldador':      'Metalúrgico',
  // English names (fallback for players with EN game language)
  'Police Officer':     'Policial',
  'Park Ranger':        'Guarda Florestal',
  'Construction Worker':'Construtor Civil',
  'Firefighter':        'Bombeiro',
  'Mechanic':           'Mecânico',
  'Welder':             'Metalúrgico',
  'Carpenter':          'Carpinteiro',
  'Burglar':            'Ladrão',
  'Chef':               'Chef',
  'Faz-Tudo':           'Assistente Técnico',
  'DIY Expert':         'Assistente Técnico',
  'Farmer':             'Fazendeiro',
  'Fishing Guide':      'Pescador',
  'Doctor':             'Doutor',
  'Veteran':            'Veterano',
  'Lumberjack':         'Lenhador',
  'Nurse':              'Enfermeiro',
  'Fitness Instructor': 'Personal Trainer',
  'Burger Flipper':     'Chapista',
  'Electrician':        'Eletricista',
  'Engineer':           'Engenheiro',
  'Security Guard':     'Segurança',
  'Blacksmith':         'Ferreiro',
  'Rancher':            'Pecuarista',
  'Tailor':             'Costureiro',
};

export function getProfessionImageUrl(profession: string | null | undefined): string | undefined {
  if (!profession) return undefined;
  const imgName = PROF_NAME_TO_IMG[profession] ?? profession;
  return _profImgs[`../../assets/profissoes/${imgName}.png`];
}

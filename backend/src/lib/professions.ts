// Normalização de profissão para estatísticas.
//
// O mod exporta o nome da profissão via getUIName() — ou seja, no IDIOMA DO JOGO
// de cada jogador. Sem normalizar, "Lenhador", "Lumberjack" e "Bûcheron" viram
// três profissões diferentes nas estatísticas (caso real em produção, 2026-09).
//
// Fonte dos nomes: media/lua/shared/Translate/{PTBR,EN,FR,ES}/UI.json do B42
// (chaves UI_prof_*). O nome canônico é sempre o PTBR atual do jogo.
// LEGACY_ALIASES cobre traduções PTBR antigas que ainda existem em entries
// de runs criadas em builds anteriores.

const PROFESSION_TRANSLATIONS: Record<string, string[]> = {
  'Segurança':               ['Security Guard', 'Agent de sécurité', 'Guardia de seguridad'],
  'Pedreiro':                ['Construction Worker', 'Maçon', 'Obrero'],
  'Guarda Florestal':        ['Park Ranger', 'Garde forestier', 'Guardia forestal'],
  'Policial':                ['Police Officer', 'Policier', 'Agente de policía'],
  'Bombeiro':                ['Firefighter', 'Pompier', 'Bombero'],
  'Profissão Personalizada': ['Custom Occupation', 'Sans emploi', 'Desempleado'],
  'Mecânico':                ['Mechanic', 'Mécanicien', 'Mecánico'],
  'Costureiro':              ['Tailor', 'Couturier', 'Sastre'],
  'Soldador':                ['Welder', 'Ferronnier', 'Obrero metalúrgico'],
  'Ferreiro':                ['Blacksmith', 'Forgeron', 'Herrero'],
  'Carpinteiro':             ['Carpenter', 'Menuisier', 'Carpintero'],
  'Ladrão':                  ['Burglar', 'Cambrioleur', 'Ladrón'],
  'Chef':                    ['Cocinero'],
  'Faz-Tudo':                ['DIY Expert', 'Réparateur', 'Reparador'],
  'Fazendeiro':              ['Farmer', 'Agriculteur', 'Granjero'],
  'Guia de Pesca':           ['Fishing Guide', 'Pêcheur professionnel', 'Guía de Pesca'],
  'Médico':                  ['Doctor', 'Docteur'],
  'Veterano':                ['Veteran', 'Vétéran'],
  'Lenhador':                ['Lumberjack', 'Bûcheron', 'Leñador'],
  'Enfermeiro':              ['Nurse', 'Infirmier', 'Enfermera'],
  'Personal Trainer':        ['Fitness Instructor', 'Professeur de fitness', 'Monitor de fitness'],
  'Chapista':                ['Burger Flipper', 'Cuistot de fast-food', 'Aprendiz de cocina'],
  'Eletricista':             ['Electrician', 'Électricien', 'Electricista'],
  'Engenheiro':              ['Engineer', 'Ingénieur', 'Ingeniero'],
  'Pecuarista':              ['Rancher', 'Éleveur de bétail', 'Ganadero'],
};

// Traduções PTBR de builds anteriores (mesma profissão, nome antigo)
const LEGACY_ALIASES: Record<string, string> = {
  'Construtor Civil':   'Pedreiro',
  'Desempregado':       'Profissão Personalizada',
  'Assistente Técnico': 'Faz-Tudo',
  'Doutor':             'Médico',
  'Metalúrgico':        'Soldador',
  'Pescador':           'Guia de Pesca',
  'Policia':            'Policial',
  'Guarda-florestal':   'Guarda Florestal',
  'Agricultor':         'Fazendeiro',
};

// Chave de comparação: sem acento, sem caixa, espaços/hífens colapsados
function foldKey(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[\s-]+/g, ' ').trim();
}

const ALIAS_INDEX = new Map<string, string>();
for (const [canonical, names] of Object.entries(PROFESSION_TRANSLATIONS)) {
  ALIAS_INDEX.set(foldKey(canonical), canonical);
  for (const n of names) ALIAS_INDEX.set(foldKey(n), canonical);
}
for (const [legacy, canonical] of Object.entries(LEGACY_ALIASES)) {
  ALIAS_INDEX.set(foldKey(legacy), canonical);
}

/** Nome canônico (PTBR) da profissão. Nomes desconhecidos (ex: profissões de mods)
 *  passam inalterados, só com espaços aparados. */
export function normalizeProfession(raw: string | null | undefined): string {
  const name = (raw ?? '').trim();
  if (!name) return 'Desconhecida';
  return ALIAS_INDEX.get(foldKey(name)) ?? name;
}

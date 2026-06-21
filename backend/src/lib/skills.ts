// Mapa autoritativo: ID do perk B42.19 → nome PT-BR exibido no site.
// O mod exporta IDs em inglês na versão B42; o decoder usa este mapa para traduzir.
// IDs B41 (Lightfooted, LongBlunt, Foraging…) foram renomeados no B42 — usar apenas B42 aqui.
export const SKILL_NAMES: Record<string, string> = {
  // Física
  Sprinting:     'Corrida',
  Lightfoot:     'Pés Leves',           // B41: Lightfooted
  Nimble:        'Agilidade',
  Sneak:         'Furtividade',          // B41: Sneaking
  Fitness:       'Condicionamento',
  Strength:      'Força',
  // Combate
  Axe:           'Machado',
  Blunt:         'Contundente Longo',    // B41: LongBlunt
  SmallBlunt:    'Contundente Curto',    // B41: ShortBlunt
  LongBlade:     'Lâmina Longa',
  SmallBlade:    'Lâmina Curta',         // B41: ShortBlade
  Spear:         'Lança',
  Maintenance:   'Manutenção',
  // Armas de fogo
  Aiming:        'Mira',
  Reloading:     'Recarga',
  // Profissões
  Woodwork:      'Marcenaria',           // B41: Carpentry
  Electricity:   'Eletricidade',         // B41: Electrical
  MetalWelding:  'Soldagem',
  Mechanics:     'Mecânica',
  Tailoring:     'Costura',
  // Sobrevivência
  Cooking:       'Culinária',
  Farming:       'Agricultura',          // B41: Agriculture
  Doctor:        'Medicina',             // B41: FirstAid
  Fishing:       'Pesca',
  Trapping:      'Armadilhas',
  Survivalist:   'Sobrevivência',        // B41: Foraging
  // Build 42
  FlintKnapping: 'Lascamento',           // B41: Knapping
  Carving:       'Entalhamento',
  Masonry:       'Alvenaria',
  Pottery:       'Cerâmica',
  Blacksmith:    'Ferraria',
  Glassmaking:   'Vidraria',
  Husbandry:     'Pecuária',             // B41: AnimalCare
  Butchering:    'Abate',
  Tracking:      'Rastreamento',
};

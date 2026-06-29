// Mapa autoritativo: ID do perk B42.19 → nome PT-BR exibido no site.
// O mod exporta IDs em inglês via perk:getType(); o decoder usa este mapa para traduzir.
// Fonte dos IDs: ISRadioInteractions.lua (Perks.X) e ISPlayerStatsAddXPUI.lua.
// IDs B41 renomeados no B42: Lightfooted→Lightfoot, Sneaking→Sneak, LongBlunt→Blunt,
// ShortBlunt→SmallBlunt, ShortBlade→SmallBlade, Carpentry→Woodwork,
// Electrical→Electricity, Foraging→PlantScavenging, FirstAid→Doctor,
// Agriculture→Farming, Knapping→FlintKnapping, AnimalCare→Husbandry.
export const SKILL_NAMES: Record<string, string> = {
  // Física
  Sprinting: "Corrida",
  Lightfoot: "Pés Leves", // B41: Lightfooted
  Nimble: "Agilidade",
  Sneak: "Furtividade", // B41: Sneaking
  Fitness: "Aptidão Física", // B41: Fitness (nome corrigido PTBR)
  Strength: "Força",
  // Combate
  Axe: "Machado",
  Blunt: "Contundente Longo", // B41: LongBlunt
  SmallBlunt: "Contundente Curto", // B41: ShortBlunt
  LongBlade: "Lâmina Longa",
  SmallBlade: "Lâmina Curta", // B41: ShortBlade
  Spear: "Lança",
  Maintenance: "Manutenção",
  // Armas de fogo
  Aiming: "Mira",
  Reloading: "Recarga",
  // Profissões
  Woodwork: "Marcenaria", // B41: Carpentry
  Electricity: "Eletricidade", // B41: Electrical
  MetalWelding: "Soldagem",
  Mechanics: "Mecânica",
  Tailoring: "Costura",
  // Sobrevivência
  Cooking: "Culinária",
  Farming: "Agricultura", // B41: Agriculture
  Doctor: "Primeiros Socorros", // B41: FirstAid
  Fishing: "Pescaria",
  Trapping: "Armadilhas",
  PlantScavenging: "Coleta", // B41: Foraging (enum B42: PlantScavenging)
  // Build 42
  FlintKnapping: "Lascamento", // B41: Knapping
  Carving: "Entalhamento",
  Masonry: "Alvenaria",
  Pottery: "Cerâmica",
  Blacksmith: "Forja",
  Glassmaking: "Vidraria",
  Husbandry: "Cuidado com Animais", // B41: AnimalCare
  Butchering: "Abate",
  Tracking: "Rastreamento",
};

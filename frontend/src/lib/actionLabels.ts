// Rótulos das ações dos sobreviventes (/estatisticas). As ações e grupos em si
// vêm do backend (ACTION_GROUPS em backend/src/lib/statistics.ts) — aqui só o texto.
// Ação sem rótulo aqui ainda aparece, com a chave crua, até ganhar um nome.

export interface ActionLabel { icon: string; label: string; unit: string }

export const ACTION_GROUP_LABELS: Record<string, { icon: string; title: string }> = {
  craft:       { icon: '🛠️', title: 'Construção e craft' },
  food:        { icon: '🍳', title: 'Alimentação e produção' },
  nature:      { icon: '🏹', title: 'Caça e natureza' },
  exploration: { icon: '🗺️', title: 'Exploração' },
  survival:    { icon: '🛏️', title: 'Sobrevivência' },
};

export const ACTION_LABELS: Record<string, ActionLabel> = {
  items_crafted:       { icon: '🛠️', label: 'Itens fabricados',            unit: 'itens' },
  materials_crafted:   { icon: '⚒️', label: 'Materiais produzidos',        unit: 'materiais' },
  weapons_crafted:     { icon: '🗡️', label: 'Armas fabricadas',            unit: 'armas' },
  forged_weapons:      { icon: '🔥', label: 'Armas forjadas',              unit: 'armas' },
  clothes_crafted:     { icon: '🧵', label: 'Roupas produzidas',           unit: 'roupas' },
  furniture_crafted:   { icon: '🪑', label: 'Móveis produzidos',           unit: 'móveis' },
  structures_built:    { icon: '🪓', label: 'Estruturas construídas',      unit: 'estruturas' },
  stone_structures:    { icon: '🧱', label: 'Estruturas de pedra',         unit: 'estruturas' },
  ceramic_items:       { icon: '🏺', label: 'Itens de cerâmica',           unit: 'itens' },
  stations_used:       { icon: '🏭', label: 'Estações de trabalho usadas', unit: 'estações' },
  meals_cooked:        { icon: '🍳', label: 'Refeições preparadas',        unit: 'refeições' },
  crops_planted:       { icon: '🌱', label: 'Culturas plantadas',          unit: 'plantios' },
  crops_harvested:     { icon: '🌽', label: 'Vegetais colhidos',           unit: 'colheitas' },
  eggs_collected:      { icon: '🥚', label: 'Ovos coletados',              unit: 'ovos' },
  milk_produced:       { icon: '🥛', label: 'Leite produzido',             unit: 'litros' },
  cheese_produced:     { icon: '🧀', label: 'Queijos produzidos',          unit: 'queijos' },
  water_collected:     { icon: '💧', label: 'Água coletada',               unit: 'litros' },
  days_no_canned:      { icon: '🌾', label: 'Dias sem comer enlatados',    unit: 'dias' },
  animals_killed:      { icon: '🍖', label: 'Animais abatidos',            unit: 'animais' },
  fish_caught:         { icon: '🐟', label: 'Peixes pescados',             unit: 'peixes' },
  animal_tracks:       { icon: '🐾', label: 'Rastros de animais seguidos', unit: 'rastros' },
  trees_cut:           { icon: '🪵', label: 'Árvores cortadas',            unit: 'árvores' },
  animal_species:      { icon: '🐑', label: 'Espécies de animais',         unit: 'espécies' },
  houses_looted:       { icon: '🏚️', label: 'Casas saqueadas',             unit: 'casas' },
  doors_opened:        { icon: '🚪', label: 'Portas abertas',              unit: 'portas' },
  basements_explored:  { icon: '🔦', label: 'Porões explorados',           unit: 'porões' },
  km_driven:           { icon: '🚗', label: 'Quilômetros dirigidos',       unit: 'km' },
  cities_visited:      { icon: '🧭', label: 'Cidades visitadas',           unit: 'cidades' },
  spiffo_visited:      { icon: '🦝', label: "Restaurantes Spiffo's visitados", unit: 'restaurantes' },
  military_visited:    { icon: '🪖', label: 'Chegaram à base militar',     unit: 'visita' },
  books_read:          { icon: '📚', label: 'Livros lidos',                unit: 'livros' },
  sleep_locations:     { icon: '🏕️', label: 'Locais diferentes de sono',   unit: 'locais' },
  hours_without_sleep: { icon: '👁️', label: 'Maior tempo sem dormir',      unit: 'horas' },
};

export function actionLabel(key: string): ActionLabel {
  return ACTION_LABELS[key] ?? { icon: '•', label: key, unit: '' };
}

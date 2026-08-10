import { supabase } from '../supabase';

export interface ExtendedStats {
  kills:             number;
  days:              number;
  animalsKilled:     number;
  fishCaught:        number;
  cropsHarvested:    number;
  itemsCrafted:      number;
  housesLooted:      number;
  hoursWithoutSleep: number;
  treesCut:          number;
  booksRead:         number;
  structuresBuilt:   number;
  cropsPlanted:      number;
  spiffoVisited:     number;
  // PZRX6
  eggsCollected:     number;
  milkProduced:      number;
  stoneStructures:   number;
  ceramicItems:      number;
  forgedWeapons:     number;
  kmDriven:          number;
  citiesVisited:     number;
  militaryVisited:   number;
  mealsCooked:       number;
  waterCollected:    number;
  materialsCrafted:  number;
  animalTracks:      number;
  // PZRX7
  weaponsCrafted:    number;
  // PZRX8
  furnitureCrafted:  number;
  clothesCrafted:    number;
  cheeseProduced:    number;
  doorsOpened:       number;
  sleepLocations:    number;
  basementsExplored: number;
  stationsUsed:      number;
  animalSpecies:     number;
  daysNoCanned:      number;
  skillLevels:       Record<string, number>;
}

export async function evaluateAchievements(
  playerId: number,
  entryId:  number,
  s:        ExtendedStats,
): Promise<void> {
  const { data: allAch } = await supabase
    .from('achievements')
    .select('id, stat, threshold');

  if (!allAch || allAch.length === 0) return;

  const { data: existing } = await supabase
    .from('player_achievements')
    .select('achievement_id')
    .eq('player_id', playerId);

  const unlocked = new Set(
    (existing ?? []).map((r: { achievement_id: number }) => r.achievement_id),
  );

  const stats: Record<string, number> = {
    kills:               s.kills,
    days:                s.days,
    animals_killed:      s.animalsKilled,
    fish_caught:         s.fishCaught,
    crops_harvested:     s.cropsHarvested,
    items_crafted:       s.itemsCrafted,
    houses_looted:       s.housesLooted,
    hours_without_sleep: s.hoursWithoutSleep,
    trees_cut:           s.treesCut,
    books_read:          s.booksRead,
    structures_built:    s.structuresBuilt,
    crops_planted:       s.cropsPlanted,
    // PZRX5: spiffo_visited é a contagem de restaurantes únicos visitados
    // Os 4 stats de Spiffo mapeiam o mesmo valor com thresholds diferentes
    spiffo_visited:   s.spiffoVisited,          // threshold 1
    spiffo_base_any:  s.spiffoVisited,          // threshold 1
    spiffo_base_five: s.spiffoVisited,          // threshold 5
    all_spiffo_bases: s.spiffoVisited >= 13 ? 1 : 0,  // threshold 1 = todos 13
    // PZRX6
    eggs_collected:    s.eggsCollected,
    milk_produced:     s.milkProduced,
    stone_structures:  s.stoneStructures,
    ceramic_items:     s.ceramicItems,
    forged_weapons:    s.forgedWeapons,
    km_driven:         s.kmDriven,
    cities_visited:    s.citiesVisited,
    military_visited:  s.militaryVisited,
    meals_cooked:      s.mealsCooked,
    water_collected:   s.waterCollected,
    materials_crafted: s.materialsCrafted,
    animal_tracks:     s.animalTracks,
    // PZRX7
    weapons_crafted:   s.weaponsCrafted,
    // PZRX8
    furniture_crafted:  s.furnitureCrafted,
    clothes_crafted:    s.clothesCrafted,
    cheese_produced:    s.cheeseProduced,
    doors_opened:       s.doorsOpened,
    sleep_locations:    s.sleepLocations,
    basements_explored: s.basementsExplored,
    all_stations_used:  s.stationsUsed,
    animal_species:     s.animalSpecies,
    days_no_canned:     s.daysNoCanned,
  };

  // Conquistas individuais de skill: stat key = "skill_<id>" (lowercase English ID)
  for (const [id, level] of Object.entries(s.skillLevels)) {
    stats[`skill_${id}`] = level;
  }
  const now = new Date().toISOString();

  const toInsert = (allAch as Array<{ id: number; stat: string; threshold: number }>)
    .filter(a => !unlocked.has(a.id) && (stats[a.stat] ?? 0) >= a.threshold)
    .map(a => ({ player_id: playerId, achievement_id: a.id, entry_id: entryId, unlocked_at: now }));

  if (toInsert.length > 0) {
    await supabase.from('player_achievements').insert(toInsert);
  }
}

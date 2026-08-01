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

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
    kills:              s.kills,
    days:               s.days,
    animals_killed:     s.animalsKilled,
    fish_caught:        s.fishCaught,
    crops_harvested:    s.cropsHarvested,
    items_crafted:      s.itemsCrafted,
    houses_looted:      s.housesLooted,
    hours_without_sleep: s.hoursWithoutSleep,
  };
  const now = new Date().toISOString();

  const toInsert = (allAch as Array<{ id: number; stat: string; threshold: number }>)
    .filter(a => !unlocked.has(a.id) && (stats[a.stat] ?? 0) >= a.threshold)
    .map(a => ({ player_id: playerId, achievement_id: a.id, entry_id: entryId, unlocked_at: now }));

  if (toInsert.length > 0) {
    await supabase.from('player_achievements').insert(toInsert);
  }
}

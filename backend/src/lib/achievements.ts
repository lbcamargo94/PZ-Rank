import { supabase } from '../supabase';

export async function evaluateAchievements(
  playerId: number,
  entryId:  number,
  kills:    number,
  days:     number,
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

  const stats: Record<string, number> = { kills, days };
  const now = new Date().toISOString();

  const toInsert = (allAch as Array<{ id: number; stat: string; threshold: number }>)
    .filter(a => !unlocked.has(a.id) && (stats[a.stat] ?? 0) >= a.threshold)
    .map(a => ({ player_id: playerId, achievement_id: a.id, entry_id: entryId, unlocked_at: now }));

  if (toInsert.length > 0) {
    await supabase.from('player_achievements').insert(toInsert);
  }
}

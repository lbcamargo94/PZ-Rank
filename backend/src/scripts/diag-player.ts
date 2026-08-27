import { supabase } from '../supabase';
import { computeScore, sumSkillLevels } from '../lib/scoring';
import type { Objectives } from '../types';

async function main() {
  const nick   = process.argv[2] ?? 'BLACK';
  const doFix  = process.argv[3] === '--fix';

  const { data: players } = await supabase
    .from('players')
    .select('id, nick, status, blocked')
    .ilike('nick', `%${nick}%`);

  if (!players?.length) { console.log('Nenhum player encontrado.'); return; }

  for (const p of players) {
    const { data: entries } = await supabase
      .from('entries')
      .select('id, character_name, score, kills, days, objectives, sandbox_ok, disqualification_reason, flagged_reason, flagged_at, updated_at, is_alive')
      .eq('player_id', p.id)
      .order('updated_at', { ascending: false });

    console.log(`\n=== ENTRIES [${p.nick}] ===`);
    console.log(JSON.stringify(entries, null, 2));

    if (doFix && entries) {
      for (const e of entries as Array<Record<string, unknown>>) {
        // Corrige entradas com score=0 mas sandbox_ok=true e sem disqualification_reason
        if (e['score'] === 0 && e['sandbox_ok'] === true && !e['disqualification_reason']) {
          const kills = (e['kills'] as number) ?? 0;
          const objectives = (e['objectives'] as Objectives | null) ?? null;
          const correctScore = computeScore(kills, sumSkillLevels(e['skills'] as string | null), objectives);

          const { error } = await supabase
            .from('entries')
            .update({
              score:          correctScore,
              flagged_reason: null,
              flagged_at:     null,
            })
            .eq('id', e['id'] as number);

          if (error) {
            console.error(`  ERRO ao corrigir entry ${e['id']}:`, error.message);
          } else {
            console.log(`  ✓ Entry ${e['id']} (${e['character_name']}): score 0 → ${correctScore}, flag removida`);
          }
        }
      }
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
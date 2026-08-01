/**
 * fix-zero-scores.ts
 *
 * Corrige entradas com score=0 indevido:
 * condição: sandbox_ok=true E disqualification_reason IS NULL E kills > 0
 * Esses registros têm score zerado por bug de reativação (mod_removed),
 * não por desqualificação legítima.
 *
 * Execução (Supabase produção):
 *   npx tsx src/scripts/fix-zero-scores.ts
 *
 * Modo simulação (sem gravar no banco):
 *   DRY_RUN=true npx tsx src/scripts/fix-zero-scores.ts
 */

import { supabase } from '../supabase';
import { computeScore } from '../lib/scoring';
import type { Objectives } from '../types';

const DRY_RUN = process.env['DRY_RUN'] === 'true';

async function main() {
  if (DRY_RUN) console.log('[DRY RUN] Nenhuma alteração será gravada.\n');

  // Busca todas as entradas elegíveis para correção
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, player_id, character_name, kills, objectives, score, flagged_reason, flagged_at')
    .eq('score', 0)
    .eq('sandbox_ok', true)
    .is('disqualification_reason', null)
    .gt('kills', 0)
    .order('id', { ascending: true });

  if (error) {
    console.error('Erro ao buscar entradas:', error.message);
    process.exit(1);
  }

  if (!entries?.length) {
    console.log('Nenhuma entrada elegível encontrada. Tudo OK.');
    return;
  }

  console.log(`${entries.length} entrada(s) com score=0 indevido encontrada(s):\n`);

  let fixed = 0;
  let skipped = 0;

  for (const e of entries as Array<Record<string, unknown>>) {
    const kills      = (e['kills'] as number) ?? 0;
    const objectives = (e['objectives'] as Objectives | null) ?? null;
    const correctScore = computeScore(kills, objectives);

    console.log(
      `  entry ${e['id']} | player ${e['player_id']} | "${e['character_name']}"` +
      ` | kills=${kills} | score: 0 → ${correctScore}` +
      (e['flagged_reason'] ? ` | flag: ${e['flagged_reason']} → removida` : '')
    );

    if (DRY_RUN) { skipped++; continue; }

    const { error: updateError } = await supabase
      .from('entries')
      .update({
        score:          correctScore,
        flagged_reason: null,
        flagged_at:     null,
      })
      .eq('id', e['id'] as number);

    if (updateError) {
      console.error(`    ERRO: ${updateError.message}`);
      skipped++;
    } else {
      fixed++;
    }
  }

  console.log(
    DRY_RUN
      ? `\n[DRY RUN] ${entries.length} entradas seriam corrigidas.`
      : `\nConcluído: ${fixed} corrigida(s), ${skipped} erro(s).`
  );
}

main().catch(e => { console.error('Erro fatal:', e); process.exit(1); });
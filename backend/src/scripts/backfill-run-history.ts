/**
 * backfill-run-history.ts
 *
 * Recupera para run_history as runs que foram apagadas quando o jogador começou
 * uma partida nova com o mesmo nome de personagem (antes da migration_v38).
 * Lógica em lib/runHistoryBackfill.ts (testada); aqui só carrega dados e grava.
 *
 * --dry-run     não grava nada — mostra o que seria recuperado, por fonte.
 * --skip-empty  descarta mortes do jornal com 0 dias E 0 kills (personagem
 *               recriado no início pra sortear spawn/traits, não é run de verdade)
 * --source=snapshot:<arquivo.json>:<ISO>   cópia de GET /entries tirada em <ISO>
 * --source=dump:<arquivo.json>:<ISO>       linhas de entries exportadas do dump SQL
 *   (a ordem dos --source define a prioridade: o primeiro que cobrir a run vence)
 *
 * Execução (produção):
 *   npx tsx src/scripts/backfill-run-history.ts --dry-run \
 *     --source=snapshot:/tmp/snapshot.json:2026-09-24T18:00:00Z \
 *     --source=dump:/tmp/dump_entries.json:2026-09-03T17:49:00Z
 */

import fs from 'fs';
import { supabase } from '../supabase';
import { config } from '../config';
import { planBackfill, type BackfillInput, type CurrentEntry, type DeathEvent, type FullRow } from '../lib/runHistoryBackfill';
import { isEmptyRun } from '../lib/runHistory';

const DRY_RUN    = process.argv.includes('--dry-run');
const SKIP_EMPTY = process.argv.includes('--skip-empty');

function parseSources(): BackfillInput['sources'] {
  return process.argv
    .filter(a => a.startsWith('--source='))
    .map(a => {
      const [name, ...rest] = a.slice('--source='.length).split(':');
      // caminho pode ter ":" (C:\...) — o timestamp é sempre o último pedaço ISO
      const iso  = rest.slice(-3).join(':');
      const file = rest.slice(0, -3).join(':');
      if (name !== 'snapshot' && name !== 'dump') throw new Error(`fonte inválida: ${name}`);
      if (isNaN(Date.parse(iso))) throw new Error(`timestamp inválido em ${a}`);
      const rows = JSON.parse(fs.readFileSync(file, 'utf8')) as FullRow[];
      return { name, takenAt: new Date(iso).toISOString(), rows };
    });
}

async function main() {
  const sources = parseSources();

  const [entriesRes, journalRes, historyRes, playersRes] = await Promise.all([
    supabase.from(config.tableName).select('id, player_id, character_name, days, kills, time_raw, is_alive, deleted_at'),
    supabase.from('journal_events').select('player_id, char_name, data, created_at').eq('type', 'player_died'),
    supabase.from('run_history').select('player_id, character_name, days, kills'),
    supabase.from('players').select('id, nick'),
  ]);
  const err = entriesRes.error ?? journalRes.error ?? historyRes.error ?? playersRes.error;
  if (err) throw err;

  type E = Omit<CurrentEntry, 'deleted'> & { deleted_at: string | null };
  const entries: CurrentEntry[] = ((entriesRes.data ?? []) as E[]).map(e => ({
    ...e, is_alive: e.is_alive === true, deleted: e.deleted_at != null,
  }));
  const journal = ((journalRes.data ?? []) as Array<DeathEvent & { created_at: string | Date; data: unknown }>).map(j => ({
    ...j,
    created_at: new Date(j.created_at).toISOString(),
    data: (typeof j.data === 'string' ? JSON.parse(j.data) : j.data) as DeathEvent['data'],
  }));
  const nick = new Map(((playersRes.data ?? []) as Array<{ id: number; nick: string }>).map(p => [p.id, p.nick]));

  const plan = planBackfill({
    entries, journal, sources,
    existing: (historyRes.data ?? []) as BackfillInput['existing'],
  });

  // Nick atual pra runs vindas só do jornal; descarta jogadores que não existem mais
  const named = plan
    .map(p => ({ ...p, row: { ...p.row, name: p.row['name'] ?? nick.get(Number(p.row['player_id'])) } as Record<string, unknown> }))
    .filter(p => p.row.name != null);

  // Mortes do jornal com 0 dias e 0 kills: na prática, personagem recriado logo no
  // início (sortear spawn/traits) — não é uma run de verdade. --skip-empty descarta.
  // Mesma regra do arquivamento automático (isEmptyRun em lib/runHistory.ts)
  const isEmpty = (p: typeof named[number]) => isEmptyRun(p.row['days'], p.row['kills']);
  const emptyCount = named.filter(isEmpty).length;
  const ready = SKIP_EMPTY ? named.filter(p => !isEmpty(p)) : named;
  console.log(`\nMortes do jornal com 0 dias e 0 kills: ${emptyCount} ${SKIP_EMPTY ? '(DESCARTADAS por --skip-empty)' : '(incluídas — use --skip-empty pra descartar)'}`);

  const bySource = ready.reduce<Record<string, number>>((acc, p) => { acc[p.source] = (acc[p.source] ?? 0) + 1; return acc; }, {});
  console.log(`\nEntradas: ${entries.length} | mortes no jornal: ${journal.length} | já no histórico: ${(historyRes.data ?? []).length}`);
  console.log(`Runs a recuperar: ${ready.length}`, bySource, plan.length !== named.length ? `(descartadas sem jogador: ${plan.length - named.length})` : '');
  const journalDays = ready.filter(p => p.source === 'journal').map(p => Number(p.row['days'])).sort((a, b) => a - b);
  if (journalDays.length) {
    const buckets = [[0, 0], [1, 7], [8, 30], [31, 90], [91, 99999]].map(([a, b]) =>
      `${a === b ? a : `${a}–${b === 99999 ? '+' : b}`}d: ${journalDays.filter(d => d >= a! && d <= b!).length}`);
    console.log('Parciais (jornal) por dias:', buckets.join(' | '));
  }
  console.log('\nMaiores runs recuperadas:');
  for (const p of [...ready].sort((a, b) => Number(b.row['days']) - Number(a.row['days'])).slice(0, 20)) {
    console.log(`  ${String(p.row.name).padEnd(22)} ${String(p.row['character_name']).padEnd(24)} ${p.note}${p.is_partial ? ' [parcial]' : ''}`);
  }

  if (DRY_RUN) { console.log('\n--dry-run: nada gravado.'); return; }

  let inserted = 0;
  for (let i = 0; i < ready.length; i += 100) {
    const batch = ready.slice(i, i + 100).map(p => ({ ...p.row, source: p.source, is_partial: p.is_partial }));
    const { error } = await supabase.from('run_history').insert(batch);
    if (error) { console.error(`ERRO no lote ${i / 100 + 1}:`, error); process.exit(1); }
    inserted += batch.length;
  }
  console.log(`\nGravadas ${inserted} runs em run_history.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

// Histórico de runs (migration_v38).
//
// `entries` guarda a run ATUAL de cada (jogador, nome de personagem) — há
// UNIQUE(player_id, character_name). Quando o jogador morre e começa uma partida
// nova com o mesmo nome, a linha é reaproveitada; antes disso a run anterior era
// simplesmente apagada. Agora ela é copiada para `run_history` antes de ser
// sobrescrita (sync e cadastro manual pelo moderador).

import { supabase } from '../supabase';
import { config } from '../config';
import { ACTION_KEYS, isEmptyRun } from './statistics';

/** Mesma regra que o sync já usava: o tempo de jogo caiu mais da metade = partida
 *  nova. (Não basta "caiu": uma leitura ruim pontual do código não pode arquivar
 *  e zerar uma run legítima — ver comentário do DrChatO em routes/sync.ts.) */
export function isNewRunOf(prevTimeRaw: number, newTimeRaw: number): boolean {
  return newTimeRaw < prevTimeRaw * 0.5;
}

// isEmptyRun mora em statistics.ts (regra oficial também das estatísticas);
// reexportada aqui pra quem arquiva runs.
export { isEmptyRun };

const COPY_COLS = [
  'id', 'player_id', 'season_id', 'name', 'character_name', 'profession',
  'days', 'time_raw', 'time_str', 'kills', 'score', 'skills', 'traits', 'objectives',
  'is_alive', 'sandbox_ok', 'disqualification_reason', 'death_cause', 'death_region', 'weapon_kills', 'start_region',
  'stats_synced_at', 'run_started_at', 'created_at', 'updated_at',
  ...ACTION_KEYS,
];

type EntryRow = Record<string, unknown> & {
  id: number; is_alive: boolean | number; created_at: string | Date;
  updated_at: string | Date | null; run_started_at: string | Date | null;
};

/** Monta a linha de run_history a partir da linha atual de entries (puro — testado). */
export function buildHistoryRow(e: EntryRow, source: 'sync' | 'manual', now = new Date()) {
  const alive = e.is_alive === true || e.is_alive === 1;
  const row: Record<string, unknown> = {
    entry_id:       e.id,
    source,
    is_partial:     false,
    // Linhas antigas não tinham run_started_at — o created_at da linha é o melhor
    // palpite (pode ser o início de uma run ainda mais antiga, se já houve outra troca)
    run_started_at: e.run_started_at ?? e.created_at,
    // Morta: o último sync (updated_at) é o momento da morte registrada.
    // Viva: run abandonada sem morte registrada — termina agora, na troca.
    run_ended_at:   !alive && e.updated_at ? e.updated_at : now.toISOString(),
  };
  for (const col of COPY_COLS) {
    if (col === 'id' || col === 'created_at' || col === 'updated_at' || col === 'run_started_at') continue;
    if (col in e) row[col] = e[col];
  }
  return row;
}

/**
 * Copia a run atual da entry para run_history. Nunca lança: uma falha aqui não pode
 * travar o sync do jogador (o backup diário cobre o pior caso) — mas loga alto.
 */
export async function archiveRun(entryId: number, source: 'sync' | 'manual'): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(config.tableName)
      .select(COPY_COLS.join(', '))
      .eq('id', entryId)
      .maybeSingle();
    if (error || !data) {
      console.error('[run-history] ERRO ao ler run para arquivar | entry=', entryId, error);
      return false;
    }
    const entry = data as unknown as EntryRow;
    if (isEmptyRun(entry['days'], entry['kills'])) {
      console.log(`[run-history] run vazia (0 dias, 0 kills) não arquivada | entry=${entryId}`);
      return false;
    }
    const row = buildHistoryRow(entry, source);
    const { error: insErr } = await supabase.from('run_history').insert([row]);
    if (insErr) {
      console.error('[run-history] ERRO ao arquivar run | entry=', entryId, insErr);
      return false;
    }
    console.log(`[run-history] run arquivada | entry=${entryId} | ${String(row.character_name)} | ${String(row.days)} dias | ${String(row.kills)} kills`);
    return true;
  } catch (e) {
    console.error('[run-history] ERRO inesperado | entry=', entryId, e);
    return false;
  }
}

// Temporada ativa — lida a cada sync, então fica em cache curto
let _season: { id: number | null; at: number } | null = null;
export async function getActiveSeasonId(): Promise<number | null> {
  if (_season && Date.now() - _season.at < 5 * 60 * 1000) return _season.id;
  const { data } = await supabase.from('seasons').select('id').eq('is_active', true).maybeSingle();
  _season = { id: (data as { id: number } | null)?.id ?? null, at: Date.now() };
  return _season.id;
}

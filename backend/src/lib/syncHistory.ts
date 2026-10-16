import { supabase } from '../supabase';
import type { DecodedCode } from '../types';

// Histórico de syncs (v4.29.0): uma linha por sync decodificado, com o resultado.
//
// Antes só existia o estado ATUAL da run — cada sync sobrescrevia o anterior, e a linha do
// tempo de um caso suspeito dependia de pedir o PZRank_log.txt ao jogador (editável). Os
// casos de 26-30/09 (Anastacia Glubby, Chris Pereira, cocranmac) teriam saído direto daqui.
//
// Não coleta nada novo: só guarda o que o Companion já envia no sync. Retenção de 90 dias
// (pruneSyncHistory, cron diário). Peso medido em 01/10/2026: ~3.100 syncs/dia → ~60 MB/mês,
// ~180 MB estáveis com a retenção.
export const SYNC_HISTORY_RETENTION_DAYS = 90;

export type SyncResult = 'aceito' | 'recusado' | 'desclassificado' | 'mod_desatualizado';

export function classifySyncOutcome(
  status: number,
  body: Record<string, unknown> | null,
): { result: SyncResult; detail: string | null } {
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 300) : null);
  if (status === 426) return { result: 'mod_desatualizado', detail: text(body?.['error']) };
  if (status >= 400)  return { result: 'recusado', detail: text(body?.['error']) };
  if (body?.['disqualified']) {
    return { result: 'desclassificado', detail: text(body['disqualified_reason']) ?? text(body['message']) };
  }
  if (body?.['stale']) return { result: 'recusado', detail: null };
  return { result: 'aceito', detail: null };
}

export interface SyncRecord {
  playerId: number;
  entryId:  number | null;
  decoded:  DecodedCode;
  status:   number;
  body:     Record<string, unknown> | null;
  flag:     string | null;   // anomalia gravada (ou que motivou a recusa) neste sync
}

// Nunca lança: o histórico não pode derrubar nem atrasar o sync.
export async function recordSync(r: SyncRecord): Promise<void> {
  try {
    const { result, detail } = classifySyncOutcome(r.status, r.body);
    const score = typeof r.body?.['score'] === 'number' ? (r.body['score'] as number) : null;
    const { error } = await supabase.from('sync_history').insert([{
      player_id:      r.playerId,
      entry_id:       r.entryId,
      character_name: r.decoded.characterName,
      result,
      detail:         detail ?? r.flag,
      http_status:    r.status,
      time_raw:       r.decoded.timeRaw,
      days:           r.decoded.days,
      kills:          r.decoded.kills,
      score,
      is_alive:       r.decoded.isAlive,
      sandbox_ok:     r.decoded.sandboxOk,
      code_reason:    r.decoded.disqualificationReason,
      mod_version:    r.decoded.modVersion,
      code_ts:        r.decoded.codeTimestamp ?? null,   // hora de geração (relógio do PC do jogador)
      skills:         r.decoded.skills.join(', ') || null,
      flagged:        r.flag,
    }]);
    if (error) console.error('[sync-history] falha ao gravar:', error.message ?? error);
  } catch (err) {
    console.error('[sync-history] erro inesperado:', err);
  }
}

export async function pruneSyncHistory(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - SYNC_HISTORY_RETENTION_DAYS * 86_400_000).toISOString();
  // delete() dos adaptadores não devolve as linhas: conta antes de apagar
  const { count, error: countErr } = await supabase
    .from('sync_history').select('id', { count: 'exact', head: true }).lt('at', cutoff);
  if (countErr) throw countErr;
  const { error } = await supabase.from('sync_history').delete().lt('at', cutoff);
  if (error) throw error;
  return count ?? 0;
}

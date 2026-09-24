// Recuperação das runs que foram apagadas antes de existir run_history.
//
// Fontes, da mais completa pra mais parcial:
//   1. snapshot — cópia de GET /entries (JSON) feita antes da run ser sobrescrita
//   2. dump     — /root/pzrank_dump.sql (2026-09-03), linhas de entries
//   3. journal  — eventos player_died (dias, kills, pontuação, causa) desde 2026-09-06
//
// Função pura: recebe tudo já carregado e devolve o que inserir em run_history.
// Testada em __tests__/run-history.test.ts; executada por scripts/backfill-run-history.ts.

import { isNewRunOf } from './runHistory';

export interface CurrentEntry {
  id: number; player_id: number | null; character_name: string | null;
  days: number; kills: number; time_raw: number; is_alive: boolean;
  deleted: boolean;          // removida do rank por moderador: runs dela não voltam
}
export interface DeathEvent {
  player_id: number | null; char_name: string | null; created_at: string;
  data: { days?: number; kills?: number; score?: number; cause?: string | null };
}
/** Linha completa de entries vinda do snapshot ou do dump (valores podem vir como texto). */
export type FullRow = Record<string, unknown> & { id: unknown; player_id: unknown; character_name: unknown; time_raw: unknown };
export interface ExistingHistory { player_id: number | null; character_name: string | null; days: number; kills: number }

export interface BackfillInput {
  entries:   CurrentEntry[];
  journal:   DeathEvent[];
  existing:  ExistingHistory[];
  sources:   Array<{ name: 'snapshot' | 'dump'; takenAt: string; rows: FullRow[] }>;
}

export interface PlannedRun {
  source:     'snapshot' | 'dump' | 'journal';
  is_partial: boolean;
  row:        Record<string, unknown>;
  note:       string;
}

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const bool = (v: unknown) => v === true || v === 't' || v === 'true' || v === 1 || v === '1';
const key = (player: unknown, char: unknown) => `${String(player)}\u0000${String(char)}`;

const FULL_COLS = [
  'name', 'character_name', 'profession', 'days', 'time_raw', 'time_str', 'kills', 'score',
  'skills', 'traits', 'objectives', 'sandbox_ok', 'disqualification_reason',
] as const;

export function planBackfill(input: BackfillInput): PlannedRun[] {
  const entryByKey = new Map(input.entries.map(e => [key(e.player_id, e.character_name), e]));
  const planned: PlannedRun[] = [];

  // Mortes do jornal por personagem, em ordem cronológica
  const deaths = new Map<string, Array<DeathEvent & { used: boolean }>>();
  for (const ev of [...input.journal].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const k = key(ev.player_id, ev.char_name);
    if (!deaths.has(k)) deaths.set(k, []);
    deaths.get(k)!.push({ ...ev, used: false });
  }

  // A morte da run ATUAL (entry morta com os mesmos dias/kills) não é run anterior
  for (const [k, evs] of deaths) {
    const e = entryByKey.get(k);
    if (!e || e.is_alive) continue;
    const cur = [...evs].reverse().find(ev => num(ev.data.days) === e.days && num(ev.data.kills) === e.kills);
    if (cur) cur.used = true;
  }
  // Runs já arquivadas pelo sync (depois do deploy) também não entram de novo
  for (const h of input.existing) {
    const ev = deaths.get(key(h.player_id, h.character_name))
      ?.find(x => !x.used && num(x.data.days) === h.days && num(x.data.kills) === h.kills);
    if (ev) ev.used = true;
  }

  // 1 e 2: linhas completas (snapshot/dump) cuja run foi sobrescrita depois
  const fullDone = new Set<string>();
  for (const src of input.sources) {
    for (const r of src.rows) {
      if (r['deleted_at']) continue;                    // removida por moderador: não ressuscita
      const k = key(r.player_id, r.character_name);
      const e = entryByKey.get(k);
      if (!e || e.deleted) continue;                    // entry excluída/removida: não ressuscita
      if (!isNewRunOf(num(r.time_raw), e.time_raw)) continue; // mesma run ainda está em entries
      const runKey = `${k}\u0000${num(r.time_raw)}`;
      if (fullDone.has(runKey)) continue;
      if (input.existing.some(h => key(h.player_id, h.character_name) === k && h.days >= num(r['days']) && h.kills >= num(r.kills as unknown))) continue;
      fullDone.add(runKey);

      const row: Record<string, unknown> = { entry_id: e.id, player_id: e.player_id };
      for (const c of FULL_COLS) row[c] = r[c] ?? null;
      row['objectives']  = typeof r['objectives'] === 'string' ? safeJson(r['objectives'] as string) : (r['objectives'] ?? null);
      row['sandbox_ok']  = r['sandbox_ok'] == null ? true : bool(r['sandbox_ok']);
      row['is_alive']    = bool(r['is_alive']);
      row['run_started_at'] = r['created_at'] ?? null;
      row['run_ended_at']   = r['updated_at'] ?? src.takenAt;

      // A foto é do momento da cópia; se a run morreu depois, o jornal tem o
      // estado final (dias/kills/pontuação/causa) — usa ele e consome o evento.
      const final = deaths.get(k)?.find(ev =>
        !ev.used && ev.created_at >= src.takenAt &&
        num(ev.data.days) >= num(r['days']) && num(ev.data.kills) >= num(r.kills as unknown));
      let note = `${src.name}: ${num(r['days'])}d/${num(r.kills as unknown)} kills`;
      if (final) {
        final.used = true;
        row['days']        = num(final.data.days);
        row['kills']       = num(final.data.kills);
        row['score']       = num(final.data.score);
        row['death_cause'] = final.data.cause ?? null;
        row['is_alive']    = false;
        row['run_ended_at'] = final.created_at;
        row['time_str']    = null;                     // não temos o tempo exato da morte
        note += ` → final pelo jornal: ${row['days']}d/${row['kills']} kills`;
      }
      planned.push({ source: src.name, is_partial: false, row, note });
    }
  }

  // 3: mortes restantes do jornal = runs anteriores das quais só sobrou o resumo
  for (const [k, evs] of deaths) {
    const e = entryByKey.get(k);
    // Sem entry (jogador/linha excluídos de vez) ou removida do rank: não recupera
    if (!e || e.deleted) continue;
    for (const ev of evs) {
      if (ev.used) continue;
      planned.push({
        source: 'journal',
        is_partial: true,
        note: `jornal: ${num(ev.data.days)}d/${num(ev.data.kills)} kills`,
        row: {
          entry_id:       e.id,
          player_id:      ev.player_id,
          name:           null,          // preenchido pelo script com o nick atual
          character_name: ev.char_name,
          days:           num(ev.data.days),
          kills:          num(ev.data.kills),
          score:          num(ev.data.score),
          death_cause:    ev.data.cause ?? null,
          is_alive:       false,
          sandbox_ok:     true,          // o jornal só registra mortes de syncs válidos
          run_ended_at:   ev.created_at,
        },
      });
    }
  }
  return planned;
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

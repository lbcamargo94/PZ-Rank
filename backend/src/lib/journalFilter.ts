import { normalizeCharName } from './runHistory';

// Eventos do Jornal de runs desclassificadas (v4.29.4). Antes o Jornal mostrava tudo e os
// eventos falsos tinham de ser apagados à mão (Anastacia Glubby, Chris Pereira — ver
// docs/moderacao.md). Agora some do Jornal o que a run desclassificada gerou: eventos do
// mesmo jogador e personagem a partir do início da run. Runs anteriores com o mesmo nome
// (legítimas, já arquivadas) continuam aparecendo. Nada é apagado: se a run for
// reabilitada, os eventos voltam.
export interface DisqualifiedRun {
  player_id:      number | string | null;
  character_name: string;
  run_started_at: string | null;
  created_at:     string | null;
}

export function isHiddenJournalEvent(
  ev: { player_id: number | string | null; char_name: string | null; created_at: string },
  disqualified: DisqualifiedRun[],
): boolean {
  if (ev.player_id == null || !ev.char_name) return false;
  const name = normalizeCharName(ev.char_name);
  const at   = new Date(ev.created_at).getTime();
  return disqualified.some(r => {
    if (r.player_id == null || Number(r.player_id) !== Number(ev.player_id)) return false;
    if (normalizeCharName(r.character_name) !== name) return false;
    const start = r.run_started_at ?? r.created_at;
    return !start || at >= new Date(start).getTime();
  });
}

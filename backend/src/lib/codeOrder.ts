// Ordem dos códigos de uma mesma run (v4.30.3).
//
// Caso Gets (16/10/2026): com o relógio do PC adiantado, o Companion segurou códigos na fila
// e os entregou fora de ordem; o servidor aceitava código com MENOS tempo de jogo (desde que
// não caísse pela metade) e a run voltou de 10 dias/336 abates para 8 dias/207. Também não dava
// para distinguir isso de um save restaurado (backup), porque a hora de geração do código não
// era guardada. Agora entries.last_code_ts guarda a hora (relógio do PC) do último código aceito.
//
//  - 'older_code':  gerado ANTES do último aceito e sem tempo de jogo a mais — reenvio atrasado
//                   da fila. Descarta sem anomalia (é normal), sem sobrescrever o progresso.
//  - 'save_reload': gerado DEPOIS do último aceito, mas com MENOS tempo de jogo — o jogo voltou
//                   no tempo: save recarregado/backup. Recusa e marca anomalia.
//  - null:          segue. Inclui código "mais velho" com MAIS tempo de jogo (o jogador acertou
//                   o relógio do PC para trás — a jogatina é mais nova).
// Partida nova (tempo cai pela metade, ou personagem novo após morte) não passa por aqui.
export type CodeOrderIssue = 'older_code' | 'save_reload' | null;

export function codeOrderIssue(
  prev: { last_code_ts: number | string | null; time_raw: number },
  code: { codeTimestamp: number | null; timeRaw: number },
): CodeOrderIssue {
  const lastTs = prev.last_code_ts != null ? Number(prev.last_code_ts) : null;
  if (!lastTs || !code.codeTimestamp) return null;          // sem dado para comparar (mod antigo / run antiga)
  if (code.codeTimestamp < lastTs) {
    return code.timeRaw <= prev.time_raw ? 'older_code' : null;
  }
  if (code.codeTimestamp > lastTs && code.timeRaw < prev.time_raw) return 'save_reload';
  return null;
}

// Anomalia para o moderador: "save_reload:<tempo antes>><tempo do código>" (minutos de jogo)
export function saveReloadFlag(prevTimeRaw: number, timeRaw: number): string {
  return `save_reload:${prevTimeRaw}>${timeRaw}`;
}

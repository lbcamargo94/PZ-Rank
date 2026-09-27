import type { DecodedCode } from '../types';

// Anistia de debug (v4.28.0): o moderador perdoa o debug visto até uma hora de jogo
// (entries.debug_amnesty_until_min). A marca de debug fica gravada no save para sempre,
// então todo sync seguinte chega desclassificado; com a anistia, o servidor aceita esse
// sync desde que a ÚLTIMA hora em que o debug foi visto (debug_min, mod v2.31.0+) não
// passe do limite. Debug usado de novo depois disso tem hora maior e desclassifica.
//
// Não cobre: preset alterado junto (preset=1), código sem debug_min (mod antigo — não dá
// para saber quando o debug foi visto) nem qualquer outro motivo.
export function isDebugAmnestied(
  decoded: Pick<DecodedCode, 'sandboxOk' | 'disqualificationReason' | 'debugSeenMin' | 'presetViolated'>,
  amnestyUntilMin: number | null | undefined,
): boolean {
  if (decoded.sandboxOk) return false;
  if (decoded.disqualificationReason !== 'debug') return false;
  if (decoded.presetViolated) return false;
  if (amnestyUntilMin == null || decoded.debugSeenMin == null) return false;
  return decoded.debugSeenMin <= amnestyUntilMin;
}

// Aviso de possível sessão sem o mod (mod v2.31.0+). Só vira anomalia para o moderador
// revisar — não desclassifica. O mod repete o aviso em todos os syncs da sessão em que
// detectou o gap; lastGapAtMin (entries.mod_gap_at_min) evita registrar o mesmo duas vezes.
export function newModGapFlag(
  modGap: DecodedCode['modGap'],
  lastGapAtMin: number | null | undefined,
): { flaggedReason: string; atMin: number } | null {
  if (!modGap) return null;
  if (lastGapAtMin != null && lastGapAtMin === modGap.atMin) return null;
  return { flaggedReason: `mod_gap:${modGap.minutes}`, atMin: modGap.atMin };
}

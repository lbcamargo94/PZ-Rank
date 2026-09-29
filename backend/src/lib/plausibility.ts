// Trava de plausibilidade dos abates (v4.28.2).
//
// O código de rank é só embaralhado (a chave está no próprio mod), então dá para editar os
// números e montar outro código. O servidor não tem como provar que um código veio do jogo;
// o que dá para fazer é recusar números que nenhum jogo produz.
//
// Referência em produção (29/09/2026, runs com 1+ dia): mediana 0,9 abate por hora de jogo,
// 1% mais rápido ~10/h, recorde legítimo 13/h. O caso que motivou a trava (Anastacia Glubby)
// chegou com 400.000 abates em 56 h — 7.126/h.
//
// Limite: 50 abates por hora de jogo (5x o recorde real) + folga fixa para o começo da run,
// quando poucas horas com uma horda grande distorcem a taxa.
export const MAX_KILLS_PER_GAME_HOUR = 50;
export const KILLS_GRACE = 300;

export function maxPlausibleKills(gameMinutes: number): number {
  return KILLS_GRACE + MAX_KILLS_PER_GAME_HOUR * Math.max(0, gameMinutes) / 60;
}

// Total da run: abates acima do possível para o tempo de jogo.
export function isImplausibleTotal(kills: number, timeRaw: number): boolean {
  return kills > maxPlausibleKills(timeRaw);
}

// Salto entre dois syncs da MESMA run (tempo não regrediu): abates novos acima do possível
// para o tempo jogado desde o último sync.
export function isImplausibleJump(
  prev: { kills: number; time_raw: number },
  kills: number,
  timeRaw: number,
): boolean {
  if (timeRaw < prev.time_raw) return false; // run nova: só o total vale
  return kills - prev.kills > maxPlausibleKills(timeRaw - prev.time_raw);
}

// Anomalia gravada na run para o moderador revisar: "implausible_kills:<abates>@<minutos>"
export function implausibleFlag(kills: number, timeRaw: number): string {
  return `implausible_kills:${kills}@${timeRaw}`;
}

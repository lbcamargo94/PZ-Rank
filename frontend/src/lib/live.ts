import type { Entry, LiveStatus } from '../types';

// Mantido em sincronia manual com o comportamento do backend (backend/src/routes/sync.ts):
// a cada sync sem live confirmada no YouTube ou na Twitch, no_live_streak é
// incrementado; a partir deste limite, o aviso público é exibido.
export const NO_LIVE_WARNING_THRESHOLD = 3;

export function hasLiveWarning(entry: Entry): boolean {
  return (entry.no_live_streak ?? 0) >= NO_LIVE_WARNING_THRESHOLD;
}

// Agrupa por jogador — um jogador pode estar ao vivo em mais de uma plataforma
// simultaneamente (ex: YouTube + Twitch ao mesmo tempo), e todas devem aparecer.
// YouTube primeiro por convenção de exibição — ambas as plataformas são
// igualmente aceitas pelas regras.
export function buildLiveMap(statuses: LiveStatus[]): Map<number, LiveStatus[]> {
  const map = new Map<number, LiveStatus[]>();
  for (const s of statuses) {
    const list = map.get(s.player_id);
    if (list) list.push(s);
    else map.set(s.player_id, [s]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.platform === b.platform ? 0 : a.platform === 'youtube' ? -1 : 1));
  }
  return map;
}

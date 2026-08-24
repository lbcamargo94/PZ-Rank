import type { Entry, LiveStatus } from '../types';

// Mantido em sincronia manual com o comportamento do backend (backend/src/routes/sync.ts):
// a cada sync sem live confirmada no YouTube, no_live_streak é incrementado; a partir
// deste limite, o aviso público é exibido.
export const NO_LIVE_WARNING_THRESHOLD = 3;

export function hasLiveWarning(entry: Entry): boolean {
  return (entry.no_live_streak ?? 0) >= NO_LIVE_WARNING_THRESHOLD;
}

export function buildLiveMap(statuses: LiveStatus[]): Map<number, LiveStatus> {
  const map = new Map<number, LiveStatus>();
  for (const s of statuses) {
    // YouTube é a plataforma oficial (regras) — prioriza sobre Twitch quando ambas ativas.
    if (!map.has(s.player_id) || s.platform === 'youtube') map.set(s.player_id, s);
  }
  return map;
}

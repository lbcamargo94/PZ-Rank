// Estatísticas de uso dos mods (v4.30.0) — aba "Estatísticas" em Mods no painel.
//
// Fonte: entries.active_mods (lista de IDs que o mod envia em cada sync, desde a v2.18.0;
// o PZ Community Rank já vem fora da lista) cruzada com a tabela `mods`. Cada sync
// substitui a lista da run, então isto é uma FOTOGRAFIA do momento, sem histórico.
//
// Participante = jogador com run viva, válida (não desclassificada), não removida e com
// sync nos últimos `days` dias. Mods com vários IDs no mesmo item da Oficina são agrupados
// por workshop_id (mesmo critério do card em ModManagement.tsx): o jogador conta uma vez.

export interface StatsRun {
  player_id:      number | string;
  nick:           string | null;
  character_name: string;
  active_mods:    string | string[] | null;
  updated_at:     string | null;
  is_alive:       boolean | number | null;
  sandbox_ok:     boolean | number | null;
}

export interface StatsMod {
  mod_id:      string | null;
  name:        string;
  workshop_id: string | null;
  status:      string;
  is_required: boolean | number | null;
}

export type GroupStatus = 'permitido' | 'bloqueado' | 'misto' | 'nao_cadastrado';

export interface ModUsage {
  key:         string;
  name:        string;
  workshop_id: string | null;
  mod_ids:     string[];
  status:      GroupStatus;
  required:    boolean;
  players:     number;
  percent:     number;
  player_ids:  number[];
}

export interface ModStatsResult {
  days:         number | null;
  participants: number;
  summary: {
    avg_mods_per_participant: number;
    mods_in_use:              number;
    registered_unused:        number;
    unregistered_in_use:      number;
  };
  players: Record<number, { nick: string | null; character: string }>;
  items:   ModUsage[];
}

const truthy = (v: unknown) => v === true || v === 1 || v === '1' || v === 't';

function parseMods(raw: StatsRun['active_mods']): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String).filter(Boolean) : [];
  } catch { return []; }
}

export function computeModStats(
  runs: StatsRun[], mods: StatsMod[], days: number | null, now = new Date(),
): ModStatsResult {
  const since = days != null ? now.getTime() - days * 86_400_000 : null;

  // Participantes: uma run por jogador (a mais recente) entre as vivas e válidas no período
  const latest = new Map<number, StatsRun>();
  for (const r of runs) {
    if (!truthy(r.is_alive) || r.sandbox_ok === false || r.sandbox_ok === 0) continue;
    const at = r.updated_at ? new Date(r.updated_at).getTime() : 0;
    if (since != null && at < since) continue;
    const pid = Number(r.player_id);
    const cur = latest.get(pid);
    if (!cur || at > (cur.updated_at ? new Date(cur.updated_at).getTime() : 0)) latest.set(pid, r);
  }

  // Grupo de cada mod_id cadastrado: item da Oficina (workshop_id) ou o próprio mod_id
  const groupOf = new Map<string, string>();
  const groups  = new Map<string, { name: string; workshop_id: string | null; mods: StatsMod[] }>();
  for (const m of mods) {
    if (!m.mod_id) continue;
    const key = m.workshop_id ? `w-${m.workshop_id}` : `m-${m.mod_id}`;
    groupOf.set(m.mod_id, key);
    if (!groups.has(key)) groups.set(key, { name: m.name, workshop_id: m.workshop_id, mods: [] });
    groups.get(key)!.mods.push(m);
  }

  const usersByKey = new Map<string, Set<number>>();
  const unregistered = new Map<string, Set<number>>();
  const players: ModStatsResult['players'] = {};
  let totalMods = 0;
  for (const [pid, r] of latest) {
    players[pid] = { nick: r.nick, character: r.character_name };
    const ids = [...new Set(parseMods(r.active_mods))];
    totalMods += ids.length;
    for (const id of ids) {
      const key = groupOf.get(id);
      if (key) {
        if (!usersByKey.has(key)) usersByKey.set(key, new Set());
        usersByKey.get(key)!.add(pid);
      } else {
        if (!unregistered.has(id)) unregistered.set(id, new Set());
        unregistered.get(id)!.add(pid);
      }
    }
  }

  const participants = latest.size;
  const pct = (n: number) => participants ? Math.round((n / participants) * 1000) / 10 : 0;
  const items: ModUsage[] = [];
  for (const [key, g] of groups) {
    const users = usersByKey.get(key) ?? new Set<number>();
    const allActive  = g.mods.every(m => m.status === 'active');
    const allBlocked = g.mods.every(m => m.status === 'blocked');
    items.push({
      key, name: g.name, workshop_id: g.workshop_id,
      mod_ids:  g.mods.map(m => m.mod_id!),
      status:   allActive ? 'permitido' : allBlocked ? 'bloqueado' : 'misto',
      required: g.mods.some(m => truthy(m.is_required)),
      players:  users.size, percent: pct(users.size),
      player_ids: [...users].sort((a, b) => a - b),
    });
  }
  for (const [id, users] of unregistered) {
    items.push({
      key: `u-${id}`, name: id, workshop_id: null, mod_ids: [id], status: 'nao_cadastrado',
      required: false, players: users.size, percent: pct(users.size),
      player_ids: [...users].sort((a, b) => a - b),
    });
  }
  items.sort((a, b) => b.players - a.players || a.name.localeCompare(b.name));

  return {
    days, participants,
    summary: {
      avg_mods_per_participant: participants ? Math.round((totalMods / participants) * 10) / 10 : 0,
      mods_in_use:         items.filter(i => i.players > 0).length,
      registered_unused:   items.filter(i => i.status !== 'nao_cadastrado' && i.players === 0).length,
      unregistered_in_use: unregistered.size,
    },
    players, items,
  };
}

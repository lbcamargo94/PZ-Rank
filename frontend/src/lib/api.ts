import type { Player, Moderator, ModSession, ModeratorRole, Entry, PlayerFilter, PlayerProfile } from '../types';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

interface LoginResponse {
  session: { access_token: string };
  user:    { login: string };
  role:    ModeratorRole | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
  }

  if (res.status === 204) return undefined as T;

  let body: Record<string, unknown>;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Erro inesperado do servidor (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    const msg = typeof body.error === 'string' && body.error
      ? body.error
      : 'Erro desconhecido. Tente novamente.';
    throw new Error(msg);
  }

  return body as T;
}

function json(token: string | null, body: unknown): RequestInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { headers, body: JSON.stringify(body) };
}

function auth(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ── Auth ────────────────────────────────────────────────────

export async function apiLogin(login: string, password: string): Promise<ModSession> {
  const data = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    ...json(null, { login, password }),
  });
  if (!data.role) throw new Error('Usuário não tem permissão de moderador.');
  return { token: data.session.access_token, role: data.role, login: data.user.login };
}

export function apiLogout(token: string): Promise<void> {
  return request('/auth/logout', { method: 'POST', ...auth(token) });
}

// ── Players ─────────────────────────────────────────────────

export function apiRegisterPlayer(data: {
  nick: string; twitch_url?: string; youtube_url?: string;
  kick_url?: string; tiktok_url?: string;
}): Promise<Player> {
  return request('/players/register', { method: 'POST', ...json(null, data) });
}

export function apiGetPlayerProfile(id: number): Promise<PlayerProfile> {
  return request(`/players/${id}`);
}

export function apiGetPlayers(token: string, status: PlayerFilter = 'all'): Promise<Player[]> {
  return request(`/players?status=${status}`, auth(token));
}

export function apiUpdatePlayerStatus(
  token: string, id: number, status: 'approved' | 'rejected'
): Promise<Player> {
  return request(`/players/${id}/status`, {
    method: 'PATCH', ...json(token, { status }),
  });
}

export function apiBlockPlayer(token: string, id: number): Promise<Player> {
  return request(`/players/${id}/block`, { method: 'PATCH', ...auth(token) });
}

export function apiUnblockPlayer(token: string, id: number): Promise<Player> {
  return request(`/players/${id}/unblock`, { method: 'PATCH', ...auth(token) });
}

export function apiDeletePlayer(token: string, id: number): Promise<Player> {
  return request(`/players/${id}/delete`, { method: 'PATCH', ...auth(token) });
}

export function apiRestorePlayer(token: string, id: number): Promise<Player> {
  return request(`/players/${id}/restore`, { method: 'PATCH', ...auth(token) });
}

// ── Entries ─────────────────────────────────────────────────

export function apiGetEntries(sort = 'days'): Promise<Entry[]> {
  return request(`/entries?sort=${sort}`);
}

export function apiCreateEntry(
  token: string, data: {
    player_id:   number;
    code:        string;
    live_url?:   string;
    objectives?: import('../lib/objectives').Objectives;
  }
): Promise<Entry> {
  return request('/entries', { method: 'POST', ...json(token, data) });
}

export function apiDeleteEntry(token: string, id: number): Promise<void> {
  return request(`/entries/${id}`, { method: 'DELETE', ...auth(token) });
}

export function apiUpdateEntryStatus(
  token: string, id: number, patch: { is_alive?: boolean; sandbox_ok?: boolean }
): Promise<Entry> {
  return request(`/entries/${id}/status`, { method: 'PATCH', ...json(token, patch) });
}

export function apiUpdateEntryObjectives(
  token: string, id: number, objectives: import('../lib/objectives').Objectives
): Promise<Entry> {
  return request(`/entries/${id}/objectives`, { method: 'PATCH', ...json(token, { objectives }) });
}

// ── Moderators ───────────────────────────────────────────────

export function apiGetModerators(token: string): Promise<Moderator[]> {
  return request('/moderators', auth(token));
}

export function apiCreateModerator(
  token: string, data: { login: string; password: string }
): Promise<Moderator> {
  return request('/moderators', { method: 'POST', ...json(token, data) });
}

export function apiDeleteModerator(token: string, id: string): Promise<void> {
  return request(`/moderators/${id}`, { method: 'DELETE', ...auth(token) });
}

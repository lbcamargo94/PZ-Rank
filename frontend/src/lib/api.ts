import type { Player, Moderator, ModSession, ModeratorRole, Entry, PlayerFilter, PlayerProfile, Mod } from '../types';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

let _onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: () => void) { _onUnauthorized = cb; }

interface LoginResponse {
  session: { access_token: string };
  user:    { login: string };
  role:    ModeratorRole | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch (e) {
    console.error('[api] fetch error', path, e);
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
  }

  if (res.status === 204) return undefined as T;

  if (res.status === 401) {
    let errBody: Record<string, unknown> = {};
    try { errBody = await res.json(); } catch { /* sem body */ }
    _onUnauthorized?.();
    throw new Error(
      typeof errBody.error === 'string' && errBody.error
        ? errBody.error
        : 'Sessão expirada. Faça login novamente.',
    );
  }

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
  nick: string; email: string; password: string;
  twitch_url?: string; youtube_url?: string; kick_url?: string; tiktok_url?: string;
}): Promise<{ message: string }> {
  return request('/players/register', { method: 'POST', ...json(null, data) });
}

export function apiPlayerLogin(email: string, password: string): Promise<{ token: string; player_id: number; nick: string }> {
  return request('/auth/player/login', { method: 'POST', ...json(null, { email, password }) });
}

export function apiForgotPassword(email: string): Promise<{ message: string }> {
  return request('/auth/player/forgot-password', { method: 'POST', ...json(null, { email }) });
}

export function apiClaimAccount(nick: string, email: string): Promise<{ otp_pending: boolean; email: string; message: string }> {
  return request('/auth/player/claim', { method: 'POST', ...json(null, { nick, email }) });
}

export function apiConfirmClaimOtp(email: string, code: string): Promise<{ message: string; activate_token: string }> {
  return request('/auth/player/otp/confirm-claim', { method: 'POST', ...json(null, { email, code }) });
}

export function apiResendClaimOtp(email: string): Promise<{ message: string }> {
  return request('/auth/player/otp/resend-claim', { method: 'POST', ...json(null, { email }) });
}

// ── OTP — cadastro ──────────────────────────────────────────
export function apiConfirmRegistrationOtp(email: string, code: string): Promise<{ message: string }> {
  return request('/auth/player/otp/confirm-registration', { method: 'POST', ...json(null, { email, code }) });
}

export function apiResendRegistrationOtp(email: string): Promise<{ message: string }> {
  return request('/auth/player/otp/resend-registration', { method: 'POST', ...json(null, { email }) });
}

export function apiVerifyEmail(token: string): Promise<{ message: string }> {
  return request(`/auth/player/verify?token=${encodeURIComponent(token)}`);
}

// ── OTP — mudanças de conta ──────────────────────────────────
export function apiSendAccountOtp(
  playerToken: string,
  action: 'change_email' | 'change_password',
  data: { current_password: string; new_email?: string; new_password?: string },
): Promise<{ message: string }> {
  return request('/account/me/otp/send', {
    method: 'POST',
    body: JSON.stringify({ action, ...data }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${playerToken}` },
  });
}

export function apiConfirmAccountOtp(
  playerToken: string,
  action: 'change_email' | 'change_password',
  data: { code: string; current_password: string; new_email?: string; new_password?: string },
): Promise<{ message: string }> {
  return request('/account/me/otp/confirm', {
    method: 'POST',
    body: JSON.stringify({ action, ...data }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${playerToken}` },
  });
}

export function apiResetPassword(token: string, password: string): Promise<{ message: string }> {
  return request('/auth/player/reset-password', { method: 'POST', ...json(null, { token, password }) });
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

export function apiUpdatePlayerLinks(
  token: string,
  id: number,
  links: { twitch_url?: string | null; youtube_url?: string | null; kick_url?: string | null; tiktok_url?: string | null },
): Promise<Player> {
  return request(`/players/${id}/links`, { method: 'PATCH', ...json(token, links) });
}

// ── Entries ─────────────────────────────────────────────────

export function apiGetEntries(sort = 'days', token?: string): Promise<Entry[]> {
  return request(`/entries?sort=${sort}`, token ? auth(token) : undefined);
}

export function apiGetAllEntries(sort = 'score'): Promise<Entry[]> {
  return request(`/entries?sort=${sort}&all=true`);
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

export function apiSetPlayerEmail(token: string, id: number, email: string): Promise<{ message: string }> {
  return request(`/players/${id}/email`, { method: 'PATCH', ...json(token, { email }) });
}

export function apiVerifyPlayerEmail(token: string, id: number): Promise<{ id: number; nick: string; email_verified_at: string }> {
  return request(`/players/${id}/verify-email`, { method: 'PATCH', ...auth(token) });
}

export function apiActivateAccount(token: string, password: string): Promise<{ message: string }> {
  return request('/auth/player/activate', { method: 'POST', ...json(null, { token, password }) });
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

// ── Mods ─────────────────────────────────────────────────────

// ── Stats globais ────────────────────────────────────────────
export interface GlobalStats {
  total_kills:  number;
  total_days:   number;
  alive_count:  number;
  dead_count:   number;
  player_count: number;
}

export function apiGetGlobalStats(): Promise<GlobalStats> {
  return request('/stats/global');
}

export interface LegendEntry {
  name:           string;
  character_name: string | null;
  player_id:      number | null;
  kills:          number;
  days:           number;
  score:          number;
}

export interface Legends {
  most_kills:     LegendEntry | null;
  most_days:      LegendEntry | null;
  highest_score:  LegendEntry | null;
  first_champion: (LegendEntry & { entry_name?: string; season_name: string | null }) | null;
}

export function apiGetLegends(): Promise<Legends> {
  return request('/stats/legends');
}

// ── Seasons ─────────────────────────────────────────────────

export function apiGetSeasons(): Promise<import('../types').Season[]> {
  return request('/seasons');
}

export function apiGetActiveSeason(): Promise<import('../types').Season | null> {
  return request('/seasons/active');
}

export function apiGetHallOfFame(): Promise<import('../types').HallOfFameEntry[]> {
  return request('/seasons/hall-of-fame');
}

export function apiCreateSeason(token: string, data: { name: string; theme_slug?: string }): Promise<import('../types').Season> {
  return request('/seasons', { method: 'POST', ...json(token, data) });
}

export function apiCloseSeason(token: string, id: number): Promise<{ ok: boolean; archived: number }> {
  return request(`/seasons/${id}/close`, { method: 'PATCH', ...auth(token) });
}

export function apiGetMods(): Promise<Mod[]> {
  return request('/mods');
}

export function apiGetAllMods(token: string): Promise<Mod[]> {
  return request('/mods/all', auth(token));
}

export function apiAddMod(
  token: string, data: { name: string; mod_id?: string | null; workshop_url: string; is_required: boolean }
): Promise<Mod> {
  return request('/mods', { method: 'POST', ...json(token, data) });
}

export function apiUpdateMod(
  token: string,
  id: number,
  data: { name: string; mod_id?: string | null; workshop_url: string; is_required: boolean; dependency_ids?: number[] }
): Promise<Mod> {
  return request(`/mods/${id}`, { method: 'PATCH', ...json(token, data) });
}

export function apiBlockMod(token: string, id: number): Promise<Mod> {
  return request(`/mods/${id}/block`, { method: 'PATCH', ...auth(token) });
}

export function apiUnblockMod(token: string, id: number): Promise<Mod> {
  return request(`/mods/${id}/unblock`, { method: 'PATCH', ...auth(token) });
}

export function apiDeleteMod(token: string, id: number): Promise<void> {
  return request(`/mods/${id}`, { method: 'DELETE', ...auth(token) });
}

export function apiRefreshModImages(token: string): Promise<{ total: number; updated: number }> {
  return request('/mods/refresh-images', { method: 'POST', ...auth(token) });
}

// ── Conta do jogador ─────────────────────────────────
import type { PlayerAccount } from '../types';

function playerAuth(playerToken: string): RequestInit {
  return { headers: { Authorization: `Bearer ${playerToken}` } };
}

export function apiGetMyProfile(playerToken: string): Promise<PlayerAccount> {
  return request('/account/me', playerAuth(playerToken));
}

export function apiGetMyEntries(playerToken: string): Promise<import('../types').Entry[]> {
  return request('/account/me/entries', playerAuth(playerToken));
}

export function apiChangePassword(
  playerToken: string,
  current_password: string,
  new_password: string,
): Promise<{ message: string }> {
  return request('/account/me/password', {
    method: 'PATCH',
    ...json(null, { current_password, new_password }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${playerToken}` },
  });
}

export function apiChangeEmail(
  playerToken: string,
  current_password: string,
  email: string,
): Promise<{ message: string }> {
  return request('/account/me/email', {
    method: 'PATCH',
    ...json(null, { current_password, email }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${playerToken}` },
  });
}

export function apiUpdateMyLinks(
  playerToken: string,
  links: { twitch_url?: string | null; youtube_url?: string | null; kick_url?: string | null; tiktok_url?: string | null },
): Promise<{ id: number; twitch_url: string | null; youtube_url: string | null; kick_url: string | null; tiktok_url: string | null }> {
  return request('/account/me/links', {
    method: 'PATCH',
    ...json(null, links),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${playerToken}` },
  });
}

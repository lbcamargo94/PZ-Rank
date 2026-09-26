// Lista de identidades banidas do campeonato (migration_v40).
//
// Serve pra quem foi banido ANTES de ter cadastro (ex: ofensas no chat de live de
// um participante). O bloqueio do painel só vale pra conta existente; aqui ficam o
// nick e os canais da pessoa. Um cadastro (ou troca de links) que bata com a lista
// NÃO é recusado — fica pendente e marcado (players.ban_match) pra um moderador
// decidir, evitando punir por engano alguém com nick parecido.

import { supabase } from '../supabase';

export const BAN_KINDS = ['nick', 'twitch', 'youtube', 'kick', 'tiktok'] as const;
export type BanKind = typeof BAN_KINDS[number];

/** Nick comparável: minúsculo, sem acento, só letras e números. */
export function normalizeNick(raw: string | null | undefined): string {
  return (raw ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Primeiro segmento do caminho que identifica o canal em cada plataforma
const HOSTS: Record<Exclude<BanKind, 'nick'>, RegExp> = {
  twitch:  /(^|\.)twitch\.tv$/i,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/i,
  kick:    /(^|\.)kick\.com$/i,
  tiktok:  /(^|\.)tiktok\.com$/i,
};

/** Handle do canal a partir do link (ou de um handle solto). null se não der pra ler.
 *  YouTube: "@handle" ou "channel/UC..." / "c/nome" / "user/nome". */
export function channelHandle(kind: Exclude<BanKind, 'nick'>, raw: string | null | undefined): string | null {
  let s = (raw ?? '').trim();
  if (!s) return null;
  if (!/^[a-z]+:\/\//i.test(s) && !s.includes('/')) {
    // handle solto ("fabzgod", "@fabzgod")
    const h = s.toLowerCase().replace(/^@/, '');
    return h ? (kind === 'youtube' ? `@${h}` : h) : null;
  }
  if (!/^[a-z]+:\/\//i.test(s)) s = `https://${s}`;
  let url: URL;
  try { url = new URL(s); } catch { return null; }
  if (!HOSTS[kind].test(url.hostname)) return null;
  const parts = url.pathname.split('/').filter(Boolean).map(p => decodeURIComponent(p).toLowerCase());
  if (parts.length === 0) return null;
  if (kind === 'youtube') {
    if (parts[0]!.startsWith('@')) return parts[0]!;
    if (['channel', 'c', 'user'].includes(parts[0]!) && parts[1]) return `${parts[0]}/${parts[1]}`;
    return null;
  }
  return parts[0]!.replace(/^@/, '') || null;
}

/** Valor normalizado pra gravar/comparar na lista. */
export function normalizeBanValue(kind: BanKind, raw: string): string | null {
  if (kind === 'nick') return normalizeNick(raw) || null;
  return channelHandle(kind, raw);
}

export interface BanEntry { id?: number; kind: BanKind; value: string; reason: string }
export interface PlayerIdentity {
  nick?: string | null;
  twitch_url?: string | null; youtube_url?: string | null;
  kick_url?: string | null;  tiktok_url?: string | null;
}

/** Primeira entrada da lista que bate com o jogador (puro — testado). */
export function matchBan(p: PlayerIdentity, bans: BanEntry[]): BanEntry | null {
  const mine: Array<[BanKind, string | null]> = [
    ['nick',    normalizeNick(p.nick) || null],
    ['twitch',  channelHandle('twitch',  p.twitch_url)],
    ['youtube', channelHandle('youtube', p.youtube_url)],
    ['kick',    channelHandle('kick',    p.kick_url)],
    ['tiktok',  channelHandle('tiktok',  p.tiktok_url)],
  ];
  for (const b of bans) {
    if (mine.some(([k, v]) => v !== null && k === b.kind && v === b.value)) return b;
  }
  return null;
}

/** Texto gravado em players.ban_match (auditoria / painel). */
export function describeBan(b: BanEntry): string {
  return `${b.kind}:${b.value} — ${b.reason}`;
}

/** Consulta a lista no banco. Falha de leitura NUNCA barra o cadastro (loga). */
export async function findBanMatch(p: PlayerIdentity): Promise<BanEntry | null> {
  const { data, error } = await supabase.from('banned_identities').select('id, kind, value, reason');
  if (error) {
    console.error('[banned-identities] falha ao ler a lista:', error);
    return null;
  }
  return matchBan(p, (data ?? []) as BanEntry[]);
}

/** Status após verificar o e-mail: marcado na lista → continua pendente pra revisão. */
export async function statusAfterVerification(playerId: number): Promise<'approved' | 'pending'> {
  const { data } = await supabase.from('players').select('ban_match').eq('id', playerId).maybeSingle();
  return (data as { ban_match: string | null } | null)?.ban_match ? 'pending' : 'approved';
}

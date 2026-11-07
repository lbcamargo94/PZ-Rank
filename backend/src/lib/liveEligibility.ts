// Quem pode aparecer no canal de lives do Discord (v4.33.0).
//
// O filtro de conteúdo (lib/championship.ts) diz se a LIVE é do campeonato; este diz se o
// JOGADOR é do campeonato. Sem ele, qualquer conta aprovada com canal cadastrado era
// anunciada ao abrir uma live de Project Zomboid na Twitch, inclusive quem foi
// desclassificado, quem está bloqueado e quem só joga um campeonato de terceiros.
//
// Regra: conta aprovada, ativa, não bloqueada, sem alerta de identidade banida e com uma
// run viva e válida no ranking (is_alive, sandbox_ok, não apagada) — o mesmo critério do
// ranking público. Sem run viva, vale a tolerância de LIVE_GRACE_DAYS para quem acabou de
// morrer, se a última run for válida. Run desclassificada (sandbox_ok = false) como a mais
// recente tira o jogador do canal até ele ter outra run válida.

import { supabase } from '../supabase';

export type LiveBlockReason =
  | 'player_not_found'
  | 'not_approved'
  | 'deleted'
  | 'blocked'
  | 'ban_match'
  | 'no_valid_run'
  | 'disqualified'
  | 'lookup_failed';

/** Dias em que quem morreu continua sendo anunciado antes de sincronizar o personagem novo. */
export const LIVE_GRACE_DAYS = 14;

export async function liveNotificationBlock(playerId: number, now = new Date()): Promise<LiveBlockReason | null> {
  const { data: player, error } = await supabase
    .from('players')
    .select('id, status, deleted_at, blocked, ban_match')
    .eq('id', playerId)
    .maybeSingle();
  if (error) { console.error('[live-eligibility] players', playerId, error); return 'lookup_failed'; }
  if (!player) return 'player_not_found';
  const p = player as { status: string; deleted_at: string | null; blocked: boolean | number | null; ban_match: string | null };
  if (p.status !== 'approved') return 'not_approved';
  if (p.deleted_at) return 'deleted';
  if (p.blocked) return 'blocked';
  if (p.ban_match) return 'ban_match';

  const { data: runs, error: runErr } = await supabase
    .from('entries')
    .select('id')
    .eq('player_id', playerId)
    .eq('is_alive', true)
    .eq('sandbox_ok', true)
    .is('deleted_at', null)
    .limit(1);
  if (runErr) { console.error('[live-eligibility] entries', playerId, runErr); return 'lookup_failed'; }
  if (runs && runs.length > 0) return null;

  // Sem run viva: tolera quem acabou de morrer e ainda não sincronizou o personagem novo,
  // desde que a última run seja válida e tenha sido atualizada há até LIVE_GRACE_DAYS.
  const { data: last, error: lastErr } = await supabase
    .from('entries')
    .select('id, sandbox_ok, updated_at')
    .eq('player_id', playerId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (lastErr) { console.error('[live-eligibility] entries/last', playerId, lastErr); return 'lookup_failed'; }
  const latest = (last ?? [])[0] as { sandbox_ok: boolean | number; updated_at: string | null } | undefined;
  if (!latest) return 'no_valid_run';
  if (!latest.sandbox_ok) return 'disqualified';
  const updatedMs = latest.updated_at ? new Date(latest.updated_at).getTime() : 0;
  if (now.getTime() - updatedMs > LIVE_GRACE_DAYS * 86_400_000) return 'no_valid_run';
  return null;
}

/** true = pode anunciar. Registra no log o motivo quando bloqueia. */
export async function canAnnounceLive(playerId: number, nick: string): Promise<boolean> {
  const reason = await liveNotificationBlock(playerId);
  if (reason) {
    console.log('[live-eligibility] live não anunciada:', nick, `(${reason})`);
    return false;
  }
  return true;
}

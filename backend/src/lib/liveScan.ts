// Detecção de lives (YouTube e Twitch) fora do sync: varreduras independentes
// chamadas pelo cron, e a "reserva" atômica de uma live nova, usada por TODOS os
// caminhos que notificam o Discord (sync, cron e webhook do YouTube).
//
// Antes: /cron/scan-lives fazia YouTube e depois Twitch na mesma requisição — a
// Twitch esperava ~560 canais do YouTube e um erro no YouTube derrubava a Twitch.
// E sync + cron podiam ver a mesma live como "nova" ao mesmo tempo e notificar 2x.

import { supabase } from '../supabase';
import { getChannelCurrentLive, checkIsLive, YT_LIVE_MAX_AGE_MS } from './youtube';
import { extractTwitchLogin, getLiveStreams } from './twitch';
import { sendLiveNotification } from './discord';
import { isChampionshipTitle, isChampionshipTwitchGame } from './championship';
import { broadcast } from './sse';

// ── Reserva atômica ───────────────────────────────────────────────────────────
// UPDATE ... WHERE <coluna> = <valor que eu li>: só um dos concorrentes altera a
// linha; quem não alterou não notifica. prev = valor lido antes (null = sem live).

export async function claimYoutubeLive(playerId: number, prevVideoId: string | null, videoId: string): Promise<boolean> {
  let q = supabase.from('players')
    .update({ yt_last_live_video_id: videoId, yt_live_confirmed_at: new Date().toISOString() })
    .eq('id', playerId);
  q = prevVideoId === null ? q.is('yt_last_live_video_id', null) : q.eq('yt_last_live_video_id', prevVideoId);
  const { data, error } = await q.select('id');
  if (error) { console.error('[live-claim] youtube', playerId, error); return false; }
  return Array.isArray(data) && data.length > 0;
}

export async function claimTwitchLive(playerId: number, prevLiveId: string | null, liveId: string): Promise<boolean> {
  let q = supabase.from('players').update({ twitch_last_live_id: liveId }).eq('id', playerId);
  q = prevLiveId === null ? q.is('twitch_last_live_id', null) : q.eq('twitch_last_live_id', prevLiveId);
  const { data, error } = await q.select('id');
  if (error) { console.error('[live-claim] twitch', playerId, error); return false; }
  return Array.isArray(data) && data.length > 0;
}

// ── Posição no ranking (uma consulta por varredura) ──────────────────────────

type RankOf = (playerId: number) => { rank: number | null; score: number | null };

async function loadRankIndex(): Promise<RankOf> {
  const { data } = await supabase
    .from('entries')
    .select('player_id, score')
    .eq('is_alive', true)
    .eq('sandbox_ok', true)
    .is('deleted_at', null)
    .order('score', { ascending: false });
  const list = (data ?? []) as Array<{ player_id: number; score: number }>;
  return (playerId) => {
    const pos = list.findIndex(e => e.player_id === playerId);
    return { rank: pos >= 0 ? pos + 1 : null, score: pos >= 0 ? list[pos]!.score : null };
  };
}

// ── YouTube ───────────────────────────────────────────────────────────────────

export interface ScanResult {
  checked: number; liveStarted: number; liveEnded: number; liveOngoing: number;
  started: string[]; ended: string[]; ongoing: string[];
  checkFailed?: number; failedChecks?: string[];
  error?: string;
}

let youtubeRunning = false;

export async function scanYoutubeLives(): Promise<ScanResult> {
  const out: ScanResult = { checked: 0, liveStarted: 0, liveEnded: 0, liveOngoing: 0, started: [], ended: [], ongoing: [] };
  if (youtubeRunning) return { ...out, error: 'varredura anterior ainda em andamento' };
  youtubeRunning = true;
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('id, nick, yt_channel_id, yt_last_live_video_id, yt_live_confirmed_at')
      .eq('status', 'approved')
      .not('yt_channel_id', 'is', null)
      .is('deleted_at', null);
    if (error) return { ...out, error: 'Erro ao buscar jogadores.' };

    type Row = { id: number; nick: string; yt_channel_id: string; yt_last_live_video_id: string | null; yt_live_confirmed_at: string | null };
    const list = (players ?? []) as Row[];
    out.checked = list.length;
    const rankOf = await loadRankIndex();
    const BATCH = 10;

    for (let i = 0; i < list.length; i += BATCH) {
      await Promise.allSettled(list.slice(i, i + BATCH).map(async (player) => {
        if (player.yt_last_live_video_id) {
          const confirmedAtMs = player.yt_live_confirmed_at ? new Date(player.yt_live_confirmed_at).getTime() : 0;
          if (Date.now() - confirmedAtMs > YT_LIVE_MAX_AGE_MS) {
            // Teto de segurança: nunca reconfirmada de forma confiável — limpa sem gastar
            // chamada tentando confirmar de novo (ver YT_LIVE_MAX_AGE_MS em lib/youtube.ts).
            await supabase.from('players').update({ yt_last_live_video_id: null, yt_live_confirmed_at: null }).eq('id', player.id);
            out.ended.push(player.nick);
            return;
          }
          const liveInfo = await checkIsLive(player.yt_last_live_video_id);
          // null = API falhou (ou cota esgotada) — não tratar como live encerrada
          if (liveInfo !== null && !liveInfo.isLive) {
            await supabase.from('players').update({ yt_last_live_video_id: null, yt_live_confirmed_at: null }).eq('id', player.id);
            out.ended.push(player.nick);
          } else {
            // Só renova o timer de confiança em confirmação real (não "modo degradado")
            if (liveInfo?.isLive && !liveInfo.degraded) {
              await supabase.from('players').update({ yt_live_confirmed_at: new Date().toISOString() }).eq('id', player.id);
            }
            out.ongoing.push(player.nick);
          }
          return;
        }

        const live = await getChannelCurrentLive(player.yt_channel_id);
        if (!live) return;
        if (!await claimYoutubeLive(player.id, null, live.videoId)) return;   // outro caminho já registrou
        if (isChampionshipTitle(live.title, live.description)) {
          const { rank, score } = rankOf(player.id);
          await sendLiveNotification({ nick: player.nick, title: live.title, videoUrl: live.videoUrl, thumbnail: live.thumbnail, rank, score });
        }
        out.started.push(player.nick);
      }));
    }
  } catch (e) {
    console.error('[scan-lives/youtube]', e);
    out.error = e instanceof Error ? e.message : String(e);
  } finally {
    youtubeRunning = false;
  }
  out.liveStarted = out.started.length; out.liveEnded = out.ended.length; out.liveOngoing = out.ongoing.length;
  if (out.started.length > 0 || out.ended.length > 0) broadcast('live-status', { started: out.started, ended: out.ended });
  return out;
}

// ── Twitch ────────────────────────────────────────────────────────────────────
// Sem webhook próprio; a checagem em lote via GraphQL não tem cota, então roda a
// cada 10 min (antes: a cada 2h, só junto com o YouTube).

let twitchRunning = false;

export async function scanTwitchLives(): Promise<ScanResult> {
  const out: ScanResult = {
    checked: 0, liveStarted: 0, liveEnded: 0, liveOngoing: 0, started: [], ended: [], ongoing: [],
    checkFailed: 0, failedChecks: [],
  };
  if (twitchRunning) return { ...out, error: 'varredura anterior ainda em andamento' };
  twitchRunning = true;
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('id, nick, twitch_url, twitch_last_live_id')
      .eq('status', 'approved')
      .not('twitch_url', 'is', null)
      .is('deleted_at', null);
    if (error) return { ...out, error: 'Erro ao buscar jogadores.' };

    type Row = { id: number; nick: string; twitch_url: string; twitch_last_live_id: string | null };
    const byLogin = new Map<string, Row>();
    for (const p of (players ?? []) as Row[]) {
      const login = extractTwitchLogin(p.twitch_url);
      if (login) byLogin.set(login.toLowerCase(), p);
    }
    out.checked = byLogin.size;
    if (byLogin.size === 0) return out;

    const { live: liveNow, failed } = await getLiveStreams([...byLogin.keys()]);
    const rankOf = await loadRankIndex();

    await Promise.allSettled([...byLogin.entries()].map(async ([login, p]) => {
      // Checagem falhou (API instável) — inconclusivo, não mexe no estado
      // (um falso "offline" fazia a próxima checagem ver a mesma live como nova).
      if (failed.has(login)) { out.failedChecks!.push(p.nick); return; }
      const live = liveNow.get(login);
      if (!live) {
        if (p.twitch_last_live_id) {
          await supabase.from('players').update({ twitch_last_live_id: null }).eq('id', p.id);
          out.ended.push(p.nick);
        }
        return;
      }
      if (p.twitch_last_live_id === live.id) { out.ongoing.push(p.nick); return; }
      if (!await claimTwitchLive(p.id, p.twitch_last_live_id, live.id)) return;   // outro caminho já registrou
      if (isChampionshipTwitchGame(live.game)) {
        const { rank, score } = rankOf(p.id);
        await sendLiveNotification({
          nick: p.nick, title: live.title, videoUrl: `https://twitch.tv/${live.login}`,
          thumbnail: live.thumbnail, rank, score, platform: 'twitch',
        });
      }
      out.started.push(p.nick);
    }));
  } catch (e) {
    console.error('[scan-lives/twitch]', e);
    out.error = e instanceof Error ? e.message : String(e);
  } finally {
    twitchRunning = false;
  }
  out.liveStarted = out.started.length; out.liveEnded = out.ended.length; out.liveOngoing = out.ongoing.length;
  out.checkFailed = out.failedChecks!.length;
  if (out.started.length > 0 || out.ended.length > 0) broadcast('live-status', { started: out.started, ended: out.ended });
  return out;
}

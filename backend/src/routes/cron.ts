/**
 * /cron — jobs agendados (chamados pelo Vercel Cron Jobs)
 *
 * GET /cron/renew-yt-subs — renova inscrições YouTube Pub/Sub próximas de vencer
 *
 * Protegido por Authorization: Bearer <CRON_SECRET>
 * Configurar no Vercel: Settings → Cron Jobs → schedule "0 6 * * *"
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { subscribePubSub, getChannelCurrentLive, checkIsLive } from '../lib/youtube';
import { sendLiveNotification, sendLiveEndedNotification } from '../lib/discord';
import { computeScore, countSkills10 } from '../lib/scoring';
import type { Objectives, BaseObjectives } from '../types';

const router = Router();

function requireCronSecret(req: Request, res: Response): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sem segredo configurado, permite (dev)

  const auth = req.headers.authorization ?? '';
  if (auth === `Bearer ${secret}`) return true;

  res.status(401).json({ error: 'Não autorizado.' });
  return false;
}

// GET /cron/backfill-yt-subs — inscreve jogadores aprovados que ainda não têm inscrição
// Chamar uma única vez após configurar as env vars
router.get('/backfill-yt-subs', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;

  const { data: players, error } = await supabase
    .from('players')
    .select('id, nick, youtube_url, yt_channel_id')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .is('yt_channel_id', null)
    .not('youtube_url', 'is', null);

  if (error) {
    res.status(500).json({ error: 'Erro ao buscar jogadores.' });
    return;
  }

  const { extractChannelId, subscribePubSub } = await import('../lib/youtube');
  const results: Array<{ nick: string; channelId: string | null; ok: boolean; error?: string }> = [];

  for (const player of (players ?? []) as Array<{ id: number; nick: string; youtube_url: string }>) {
    const channelId = await extractChannelId(player.youtube_url);
    if (!channelId) {
      results.push({ nick: player.nick, channelId: null, ok: false, error: 'channel_id não encontrado' });
      continue;
    }

    const sub = await subscribePubSub(channelId);
    results.push({ nick: player.nick, channelId, ok: sub.ok, error: sub.error });

    await supabase
      .from('players')
      .update({
        yt_channel_id:     channelId,
        yt_sub_expires_at: sub.ok ? sub.expiresAt : null,
      })
      .eq('id', player.id);
  }

  res.json({ processed: results.length, results });
});

// GET /cron/renew-yt-subs
router.get('/renew-yt-subs', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;

  // Busca jogadores com channel_id mas sem assinatura ativa, OU com assinatura expirando em 48h
  const threshold = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: players, error } = await supabase
    .from('players')
    .select('id, nick, yt_channel_id, yt_sub_expires_at')
    .not('yt_channel_id', 'is', null)
    .is('deleted_at', null)
    .or(`yt_sub_expires_at.is.null,yt_sub_expires_at.lt.${threshold}`);

  if (error) {
    res.status(500).json({ error: 'Erro ao buscar jogadores.' });
    return;
  }

  const results: Array<{ nick: string; ok: boolean; error?: string }> = [];

  for (const player of (players ?? []) as Array<{ id: number; nick: string; yt_channel_id: string }>) {
    const result = await subscribePubSub(player.yt_channel_id);
    results.push({ nick: player.nick, ok: result.ok, error: result.error });

    if (result.ok) {
      await supabase
        .from('players')
        .update({ yt_sub_expires_at: result.expiresAt })
        .eq('id', player.id);
    }
  }

  res.json({ renewed: results.length, results });
});

// GET /cron/scan-lives — verifica quem está ao vivo agora e notifica o Discord
router.get('/scan-lives', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;

  const { data: players, error } = await supabase
    .from('players')
    .select('id, nick, yt_channel_id, yt_last_live_video_id')
    .eq('status', 'approved')
    .not('yt_channel_id', 'is', null)
    .is('deleted_at', null);

  if (error) {
    res.status(500).json({ error: 'Erro ao buscar jogadores.' });
    return;
  }

  // Busca ranking global uma única vez
  const { data: allAlive } = await supabase
    .from('entries')
    .select('player_id, score')
    .eq('is_alive', true)
    .eq('sandbox_ok', true)
    .is('deleted_at', null)
    .order('score', { ascending: false });

  type PlayerRow = { id: number; nick: string; yt_channel_id: string; yt_last_live_video_id: string | null };
  const playerList = (players ?? []) as PlayerRow[];

  const liveStarted: string[] = [];
  const liveEnded:   string[] = [];
  const liveOngoing: string[] = [];
  const BATCH = 10;

  for (let i = 0; i < playerList.length; i += BATCH) {
    const batch = playerList.slice(i, i + BATCH);

    await Promise.allSettled(batch.map(async (player) => {
      const pos   = (allAlive ?? []).findIndex((e: { player_id: number }) => e.player_id === player.id);
      const rank  = pos >= 0 ? pos + 1 : null;
      const score = (allAlive ?? []).find((e: { player_id: number; score: number }) => e.player_id === player.id)?.score ?? null;

      if (player.yt_last_live_video_id) {
        // Jogador estava ao vivo na última verificação — confirma se ainda está
        const liveInfo = await checkIsLive(player.yt_last_live_video_id);

        if (!liveInfo?.isLive) {
          // Live encerrou
          await sendLiveEndedNotification({
            nick:     player.nick,
            videoUrl: `https://www.youtube.com/watch?v=${player.yt_last_live_video_id}`,
            rank,
            score,
          });
          await supabase
            .from('players')
            .update({ yt_last_live_video_id: null })
            .eq('id', player.id);
          liveEnded.push(player.nick);
        } else {
          // Ainda ao vivo — sem nova notificação
          liveOngoing.push(player.nick);
        }
      } else {
        // Jogador não estava ao vivo — verifica se iniciou agora
        const live = await getChannelCurrentLive(player.yt_channel_id);
        if (!live) return;

        await sendLiveNotification({
          nick:      player.nick,
          title:     live.title,
          videoUrl:  live.videoUrl,
          thumbnail: live.thumbnail,
          rank,
          score,
        });
        await supabase
          .from('players')
          .update({ yt_last_live_video_id: live.videoId })
          .eq('id', player.id);
        liveStarted.push(player.nick);
      }
    }));
  }

  res.json({
    checked:     playerList.length,
    liveStarted: liveStarted.length,
    liveEnded:   liveEnded.length,
    liveOngoing: liveOngoing.length,
    started:     liveStarted,
    ended:       liveEnded,
    ongoing:     liveOngoing,
  });
});

// GET /cron/player-yt-status?nick=XXX — diagnóstico do estado YouTube de um jogador
router.get('/player-yt-status', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;

  const nick = String(req.query['nick'] ?? '').trim();
  if (!nick) {
    res.status(400).json({ error: 'Parâmetro nick obrigatório.' });
    return;
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, nick, youtube_url, yt_channel_id, yt_sub_expires_at, yt_last_live_video_id')
    .ilike('nick', nick)
    .is('deleted_at', null)
    .single();

  if (!player) {
    res.status(404).json({ error: `Jogador "${nick}" não encontrado.` });
    return;
  }

  type PlayerYt = {
    id: number; nick: string;
    youtube_url: string | null; yt_channel_id: string | null;
    yt_sub_expires_at: string | null; yt_last_live_video_id: string | null;
  };
  const p = player as PlayerYt;

  let isCurrentlyLive: boolean | null = null;
  let rssLiveVideoId:   string | null = null;

  if (p.yt_channel_id) {
    const { getChannelCurrentLive } = await import('../lib/youtube');
    const live = await getChannelCurrentLive(p.yt_channel_id);
    isCurrentlyLive = live !== null;
    rssLiveVideoId  = live?.videoId ?? null;
  }

  res.json({
    nick:                  p.nick,
    youtube_url:           p.youtube_url,
    yt_channel_id:         p.yt_channel_id,
    yt_sub_expires_at:     p.yt_sub_expires_at,
    yt_last_live_video_id: p.yt_last_live_video_id,
    sub_expired: p.yt_sub_expires_at ? new Date(p.yt_sub_expires_at) < new Date() : null,
    isCurrentlyLive,
    rssLiveVideoId,
  });
});

// POST /cron/recalculate-scores — migra objetivos antigos e recalcula todos os scores
// Mapeamento: spiffo_statue → spiffo_hq + spiffo_relic; remove kills_800k, all_skills_10
router.post('/recalculate-scores', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;

  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, kills, skills, objectives, sandbox_ok')
    .is('deleted_at', null);

  if (error) {
    res.status(500).json({ error: 'Erro ao buscar entradas.' });
    return;
  }

  type RawEntry = {
    id: number;
    kills: number;
    skills: string | null;
    objectives: Record<string, unknown> | null;
    sandbox_ok: boolean;
  };

  const rows = (entries ?? []) as RawEntry[];
  const results: Array<{ id: number; old_score?: number; new_score: number; migrated: boolean }> = [];

  for (const row of rows) {
    // Migra objetivos: converte formato antigo → novo
    let migratedObj: Objectives | null = null;
    let migrated = false;

    if (row.objectives) {
      const raw = row.objectives as Record<string, unknown>;

      // Detecta campos antigos
      const hasOldFields = 'kills_800k' in raw || 'all_skills_10' in raw || 'spiffo_statue' in raw;

      // Constrói bases migrado
      const rawBases = (raw.bases ?? {}) as Record<string, Record<string, unknown>>;
      const bases: Record<string, BaseObjectives> = {};
      for (const [k, v] of Object.entries(rawBases)) {
        bases[k] = {
          has_base: Boolean(v.has_base),
          bed:      Boolean(v.bed),
          windows:  Boolean(v.windows),
          sink:     Boolean(v.sink),
          power:    Boolean(v.power),
          food:     Boolean(v.food),
          vehicle:  Boolean(v.vehicle),
          arsenal:  Boolean(v.arsenal),
        };
      }

      // Se tinha spiffo_statue=true → marca HQ e relic como conquistados
      const spiffoStatue = Boolean(raw.spiffo_statue);
      const spiffoHq     = Boolean(raw.spiffo_hq) || spiffoStatue;
      const spiffoRelic  = Boolean(raw.spiffo_relic) || spiffoStatue;

      migratedObj = {
        bases,
        military_base: Boolean(raw.military_base),
        spiffo_hq:     spiffoHq,
        spiffo_relic:  spiffoRelic,
      };

      migrated = hasOldFields;
    }

    const skills10 = countSkills10(row.skills);
    const newScore = row.sandbox_ok ? computeScore(row.kills, skills10, migratedObj) : 0;

    const patch: Record<string, unknown> = { score: newScore, updated_at: new Date().toISOString() };
    if (migrated && migratedObj) patch.objectives = migratedObj;

    const { error: upErr } = await supabase
      .from('entries')
      .update(patch)
      .eq('id', row.id);

    results.push({ id: row.id, new_score: newScore, migrated });

    if (upErr) {
      console.error(`recalculate-scores: erro ao atualizar entry ${row.id}:`, upErr.message);
    }
  }

  res.json({
    processed: results.length,
    migrated:  results.filter(r => r.migrated).length,
    results,
  });
});

export default router;

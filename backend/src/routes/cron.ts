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
import { subscribePubSub, YT_RESOLVE_MAX_ATTEMPTS } from '../lib/youtube';
import { scanYoutubeLives, scanTwitchLives } from '../lib/liveScan';
import { sendLiveNotification } from '../lib/discord';
import { computeScore, sumSkillLevels, OFFICIAL_BASE_IDS } from '../lib/scoring';
import type { Objectives, BaseObjectives } from '../types';

const router = Router();

function requireCronSecret(req: Request, res: Response): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production'; // bloqueia em prod sem CRON_SECRET

  const auth = req.headers.authorization ?? '';
  if (auth === `Bearer ${secret}`) return true;

  res.status(401).json({ error: 'Não autorizado.' });
  return false;
}

// GET /cron/backfill-yt-subs — resolve o canal de quem cadastrou link do YouTube e
// ainda não tem yt_channel_id, e inscreve no Pub/Sub. Diário às 07:20 UTC (logo
// depois da renovação da cota da Data API, meia-noite do Pacífico).
//
// Antes: pegava sempre os mesmos 20 jogadores (sem ordem nem contagem) e a cota vivia
// esgotada, então links bons eram dados como "não encontrados" e a fila não andava
// (102 jogadores parados em 2026-09-26). Agora: resolve pela página pública do canal
// (sem cota) antes da API; só falha DEFINITIVA (canal não existe) conta tentativa;
// cota esgotada interrompe o lote sem penalizar ninguém; depois de
// YT_RESOLVE_MAX_ATTEMPTS o link sai da fila e aparece no painel da moderação.
router.get('/backfill-yt-subs', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;

  // A página pública não gasta cota; o teto protege o fallback de busca da API
  // (search.list = 100 unidades) quando a página não resolve.
  const BACKFILL_BATCH = 60;

  const { data: players, error } = await supabase
    .from('players')
    .select('id, nick, youtube_url, yt_resolve_attempts')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .is('yt_channel_id', null)
    .not('youtube_url', 'is', null)
    .lt('yt_resolve_attempts', YT_RESOLVE_MAX_ATTEMPTS)
    .order('yt_resolve_attempts', { ascending: true })
    .order('id', { ascending: true })
    .limit(BACKFILL_BATCH);

  if (error) {
    res.status(500).json({ error: 'Erro ao buscar jogadores.' });
    return;
  }

  const { resolveChannelId, subscribePubSub, isYouTubeQuotaBlocked } = await import('../lib/youtube');
  const results: Array<{ nick: string; channelId: string | null; ok: boolean; error?: string }> = [];
  let stoppedByQuota = false;

  type Row = { id: number; nick: string; youtube_url: string; yt_resolve_attempts: number | null };
  for (const player of (players ?? []) as Row[]) {
    const r = await resolveChannelId(player.youtube_url);

    if ('error' in r) {
      // Não deu pra saber agora (rede/cota) — tenta de novo amanhã sem contar
      results.push({ nick: player.nick, channelId: null, ok: false, error: 'indisponível agora' });
      if (isYouTubeQuotaBlocked()) { stoppedByQuota = true; break; }
      continue;
    }

    if ('notFound' in r) {
      const attempts = (player.yt_resolve_attempts ?? 0) + 1;
      await supabase.from('players')
        .update({ yt_resolve_attempts: attempts, yt_resolve_failed_at: new Date().toISOString() })
        .eq('id', player.id);
      results.push({ nick: player.nick, channelId: null, ok: false, error: `canal não encontrado (${attempts}/${YT_RESOLVE_MAX_ATTEMPTS})` });
      continue;
    }

    const sub = await subscribePubSub(r.id);
    results.push({ nick: player.nick, channelId: r.id, ok: sub.ok, error: sub.error });
    await supabase
      .from('players')
      .update({
        yt_channel_id:        r.id,
        yt_sub_expires_at:    sub.ok ? sub.expiresAt : null,
        yt_resolve_attempts:  0,
        yt_resolve_failed_at: null,
      })
      .eq('id', player.id);
  }

  res.json({ processed: results.length, stopped_by_quota: stoppedByQuota, results });
});

// GET /cron/renew-yt-subs
// Até 30 jogadores por chamada, em paralelo (lotes de 10).
// Timeout de 8s por canal sem retry — se falhar hoje, pega amanhã.
// O cron diário às 6h garante que todos passem pelo ciclo em ~N dias.
router.get('/renew-yt-subs', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;

  const BATCH      = 30;  // jogadores por chamada
  const CONCURRENT = 5;   // paralelo por lote — mais causa rate-limit no hub do Google
  const threshold  = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  const { data: players, error } = await supabase
    .from('players')
    .select('id, nick, yt_channel_id, yt_sub_expires_at')
    .eq('status', 'approved')
    .not('yt_channel_id', 'is', null)
    .is('deleted_at', null)
    .or(`yt_sub_expires_at.is.null,yt_sub_expires_at.lt.${threshold}`)
    .limit(BATCH);

  if (error) {
    res.status(500).json({ error: 'Erro ao buscar jogadores.' });
    return;
  }

  type PlayerRow = { id: number; nick: string; yt_channel_id: string };
  const list = (players ?? []) as PlayerRow[];
  const results: Array<{ nick: string; ok: boolean; error?: string }> = [];

  for (let i = 0; i < list.length; i += CONCURRENT) {
    const chunk = list.slice(i, i + CONCURRENT);
    const settled = await Promise.allSettled(
      chunk.map(async (player) => {
        const result = await subscribePubSub(player.yt_channel_id);
        if (result.ok) {
          await supabase
            .from('players')
            .update({ yt_sub_expires_at: result.expiresAt })
            .eq('id', player.id);
        }
        return { nick: player.nick, ok: result.ok, error: result.error };
      }),
    );
    for (const s of settled) {
      results.push(s.status === 'fulfilled' ? s.value : { nick: '?', ok: false, error: String(s.reason) });
    }
    // pausa entre lotes para não disparar rate-limit do hub do Google
    if (i + CONCURRENT < list.length) await new Promise(r => setTimeout(r, 500));
  }

  res.json({ renewed: results.filter(r => r.ok).length, total: results.length, results });
});

// GET /cron/scan-lives-youtube — a cada 2h. GET /cron/scan-lives-twitch — a cada
// 10 min (GraphQL sem cota). Independentes: um não espera nem derruba o outro
// (lib/liveScan.ts). GET /cron/scan-lives roda os dois em paralelo (compat).
router.get('/scan-lives-youtube', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;
  res.json({ youtube: await scanYoutubeLives() });
});

router.get('/scan-lives-twitch', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;
  res.json({ twitch: await scanTwitchLives() });
});

router.get('/scan-lives', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;
  const [youtube, twitch] = await Promise.all([scanYoutubeLives(), scanTwitchLives()]);
  res.json({ youtube, twitch });
});

// GET /cron/test-discord — envia uma notificação de teste ao Discord (verifica se o webhook está funcional)
router.get('/test-discord', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(500).json({ ok: false, error: 'DISCORD_WEBHOOK_URL não configurada no Vercel.' });
    return;
  }

  try {
    await sendLiveNotification({
      nick:      '🔧 Teste de Pipeline',
      title:     'Esta é uma notificação de teste — pipeline PZ-Rank funcionando',
      videoUrl:  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      rank:      1,
      score:     141000,
    });
    res.json({ ok: true, discordUrl: webhookUrl.slice(0, 50) + '…', message: 'Notificação enviada — verifique o Discord.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
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
  const EMPTY_BASE: BaseObjectives = {
    has_base: false, bed: false, windows: false,
    sink: false, power: false, food: false, vehicle: false, arsenal: false,
  };

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

      // Remove bases obsoletas (ex: march_ridge, valley_station)
      const hadObsoleteBase = Object.keys(bases).some(k => !OFFICIAL_BASE_IDS.has(k));
      for (const k of Object.keys(bases)) {
        if (!OFFICIAL_BASE_IDS.has(k)) delete bases[k];
      }

      // Adiciona bases novas que ainda não existem no registro (ex: muldraugh_cross)
      const hadMissingBase = [...OFFICIAL_BASE_IDS].some(id => !(id in bases));
      for (const id of OFFICIAL_BASE_IDS) {
        if (!(id in bases)) bases[id] = { ...EMPTY_BASE };
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

      migrated = hasOldFields || hadObsoleteBase || hadMissingBase;
    }

    const skillLevelSum = sumSkillLevels(row.skills);
    const newScore = row.sandbox_ok ? computeScore(row.kills, skillLevelSum, migratedObj) : 0;

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

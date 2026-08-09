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
import { subscribePubSub } from '../lib/youtube';

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

export default router;

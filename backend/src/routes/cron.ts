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

// GET /cron/renew-yt-subs
router.get('/renew-yt-subs', async (req: Request, res: Response): Promise<void> => {
  if (!requireCronSecret(req, res)) return;

  // Busca jogadores com inscrição expirando nas próximas 48h
  const threshold = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: players, error } = await supabase
    .from('players')
    .select('id, nick, yt_channel_id, yt_sub_expires_at')
    .not('yt_channel_id', 'is', null)
    .is('deleted_at', null)
    .lt('yt_sub_expires_at', threshold);

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

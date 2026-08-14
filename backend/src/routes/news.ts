import { Router } from 'express';
import { supabase } from '../supabase';
import { requireModerator } from '../middleware/moderator';
import { dbError } from '../lib/errors';

const router = Router();

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseStats(raw: unknown): Record<string, number> | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw as Record<string, number>;
}

async function buildSnapshot(today: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('is_alive, kills, updated_at')
    .is('deleted_at', null)
    .neq('sandbox_ok', false);

  if (error || !data) {
    return { alive_count: 0, dead_count: 0, total_kills: 0, deaths_today: 0, syncs_today: 0, kills_today: 0 };
  }

  type Row = { is_alive: boolean; kills: number; updated_at: string | null };
  const rows = data as Row[];

  const alive_count  = rows.filter(e =>  e.is_alive).length;
  const dead_count   = rows.filter(e => !e.is_alive).length;
  const total_kills  = rows.reduce((s, e) => s + (e.kills || 0), 0);
  const deaths_today = rows.filter(e => !e.is_alive && (e.updated_at ?? '').startsWith(today)).length;
  const syncs_today  = rows.filter(e =>                (e.updated_at ?? '').startsWith(today)).length;

  // kills_today = delta em relação ao snapshot de ontem
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  const yStr = d.toISOString().slice(0, 10);

  const { data: yd } = await supabase
    .from('daily_news').select('stats').eq('date', yStr).maybeSingle();

  const rawPrev   = (yd as Record<string, unknown> | null)?.stats;
  const prevStats = typeof rawPrev === 'string'
    ? JSON.parse(rawPrev) as Record<string, number>
    : rawPrev as Record<string, number> | null;
  const prevKills   = prevStats?.total_kills ?? null;
  const kills_today = prevKills !== null ? Math.max(0, total_kills - prevKills) : 0;

  return { alive_count, dead_count, total_kills, deaths_today, syncs_today, kills_today };
}

// GET /news/latest — público; cria o snapshot do dia na primeira chamada
router.get('/latest', async (_req, res) => {
  try {
    const today = todayUTC();

    const { data: existing, error: selErr } = await supabase
      .from('daily_news').select('*').eq('date', today).maybeSingle();

    if (selErr) {
      const e = dbError(selErr);
      return res.status(e.httpStatus).json({ error: e.message });
    }

    if (existing) {
      const r = existing as Record<string, unknown>;
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
      return res.json({ ...r, stats: parseStats(r.stats) });
    }

    const stats = await buildSnapshot(today);

    const { data: inserted, error: insErr } = await supabase
      .from('daily_news')
      .insert([{ date: today, stats: JSON.stringify(stats) }])
      .select().single();

    if (insErr || !inserted) {
      const e = dbError(insErr ?? { message: 'Erro ao criar snapshot.' });
      return res.status(e.httpStatus).json({ error: e.message });
    }

    const r = inserted as Record<string, unknown>;
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.json({ ...r, stats: parseStats(r.stats) ?? stats });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// GET /news/history — últimos 7 dias (moderadores)
router.get('/history', requireModerator, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('daily_news').select('*').order('date', { ascending: false }).limit(7);

    if (error) {
      const e = dbError(error);
      return res.status(e.httpStatus).json({ error: e.message });
    }

    const result = (data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      stats: parseStats(r.stats),
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /news/:date/headline — define manchete manual
router.patch('/:date/headline', requireModerator, async (req, res) => {
  try {
    const date = req.params['date'] as string;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Data inválida. Use YYYY-MM-DD.' });
    }

    const { headline } = req.body as { headline?: string | null };

    const { data: updated, error } = await supabase
      .from('daily_news').update({ headline: headline ?? null }).eq('date', date).select().single();

    if (error || !updated) {
      return res.status(404).json({ error: 'Nenhum registro encontrado para esta data.' });
    }

    const r = updated as Record<string, unknown>;
    return res.json({ ...r, stats: parseStats(r.stats) });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

export default router;

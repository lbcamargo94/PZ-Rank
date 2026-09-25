import { Router } from 'express';
import { supabase } from '../supabase';
import { requireModerator } from '../middleware/moderator';
import { dbError } from '../lib/errors';
import { officialOverview } from '../lib/statsData';
import { isEmptyRun } from '../lib/statistics';

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

// Base do total_kills gravado no snapshot. 'official_v2' = mesma fonte de
// /estatisticas e do contador da home (inclui runs anteriores, ignora partidas
// encerradas com 0 dias/0 kills). Snapshots antigos (sem esse campo) guardavam só
// a soma das runs atuais — comparar direto geraria um "kills de hoje" falso de
// centenas de milhares no dia da troca.
const KILLS_BASIS = 'official_v2';

async function buildSnapshot(today: string) {
  const [{ data, error }, overview] = await Promise.all([
    supabase
      .from('entries')
      .select('is_alive, kills, days, updated_at')
      .is('deleted_at', null)
      .neq('sandbox_ok', false),
    officialOverview().catch(() => null),
  ]);

  if (error || !data || !overview) {
    return { alive_count: 0, dead_count: 0, total_kills: 0, deaths_today: 0, syncs_today: 0, kills_today: 0 };
  }

  type Row = { is_alive: boolean; kills: number; days: number; updated_at: string | Date | null };
  const rows = data as Row[];
  const isToday = (d: string | Date | null) => d != null && new Date(d).toISOString().startsWith(today);

  // Números gerais: mesma fonte oficial de /estatisticas e do topo da home
  const alive_count  = overview.alive;
  const dead_count   = overview.dead;
  const total_kills  = overview.total_kills;
  // "Hoje": runs atuais sincronizadas hoje (mortes 0/0 não contam, mesma regra)
  const deaths_today = rows.filter(e => !e.is_alive && isToday(e.updated_at) && !isEmptyRun(e.days, e.kills)).length;
  const syncs_today  = rows.filter(e => isToday(e.updated_at)).length;
  // Soma só das runs atuais — usada apenas na transição de base (ver KILLS_BASIS)
  const currentKills = rows.reduce((s, e) => s + (e.kills || 0), 0);

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
  // Ontem na base antiga (só runs atuais) → compara com a mesma base de hoje
  const sameBasis   = (prevStats as Record<string, unknown> | null)?.['kills_basis'] === KILLS_BASIS;
  const kills_today = prevKills === null ? 0
    : Math.max(0, (sameBasis ? total_kills : currentKills) - prevKills);

  return { alive_count, dead_count, total_kills, deaths_today, syncs_today, kills_today, kills_basis: KILLS_BASIS };
}

// GET /news/latest — público; cria o snapshot do dia na primeira chamada
router.get('/latest', async (_req, res) => {
  try {
    const today = todayUTC();

    const { data: existing, error: selErr } = await supabase
      .from('daily_news').select('*').eq('date', today).maybeSingle();

    if (selErr) {
      const e = dbError(selErr);
      return res.status(e.httpStatus).json({ error: e.message, error_code: 'DB_ERROR' });
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
      return res.status(e.httpStatus).json({ error: e.message, error_code: 'DB_ERROR' });
    }

    const r = inserted as Record<string, unknown>;
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.json({ ...r, stats: parseStats(r.stats) ?? stats });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message, error_code: 'DB_ERROR' });
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

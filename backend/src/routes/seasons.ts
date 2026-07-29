import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requireMaster } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';

const router = Router();

// GET /seasons — lista todas as temporadas (público)
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) { const e = dbError(error); return res.status(e.httpStatus).json({ error: e.message }); }
  res.json(data ?? []);
});

// GET /seasons/active — temporada ativa (público)
router.get('/active', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (error) { const e = dbError(error); return res.status(e.httpStatus).json({ error: e.message }); }
  res.json(data ?? null);
});

// GET /seasons/hall-of-fame — todos os registros do Hall da Fama (público)
router.get('/hall-of-fame', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('hall_of_fame')
    .select('*')
    .order('season_id', { ascending: false });

  if (error) { const e = dbError(error); return res.status(e.httpStatus).json({ error: e.message }); }
  res.json(data ?? []);
});

// POST /seasons — criar nova temporada (master only)
router.post('/', requireMaster, async (req: ModRequest, res: Response) => {
  const { name, theme_slug } = req.body as { name?: string; theme_slug?: string };

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nome da temporada é obrigatório.' });
  }

  const { data: existing } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'Já existe uma temporada ativa. Encerre-a antes de criar uma nova.' });
  }

  const { data, error } = await supabase
    .from('seasons')
    .insert([{ name: name.trim(), theme_slug: theme_slug?.trim() || null }])
    .select()
    .single();

  if (error) { const e = dbError(error); return res.status(e.httpStatus).json({ error: e.message }); }
  res.status(201).json(data);
});

// PATCH /seasons/:id/close — encerrar temporada + arquivar top 3 (master only)
router.patch('/:id/close', requireMaster, async (req: ModRequest, res: Response) => {
  const seasonId = Number(req.params.id);
  if (!Number.isFinite(seasonId)) return res.status(400).json({ error: 'ID inválido.' });

  const { data: season, error: sErr } = await supabase
    .from('seasons')
    .select('id, is_active')
    .eq('id', seasonId)
    .maybeSingle();

  if (sErr)     { const e = dbError(sErr); return res.status(e.httpStatus).json({ error: e.message }); }
  if (!season)  return res.status(404).json({ error: 'Temporada não encontrada.' });
  if (!season.is_active) return res.status(409).json({ error: 'Temporada já encerrada.' });

  // Top 3 por score — só entries aprovadas (sandbox_ok = true), sem deleted_at
  const { data: allEntries, error: tErr } = await supabase
    .from('entries')
    .select('player_id, name, character_name, days, kills, score')
    .is('deleted_at', null)
    .neq('sandbox_ok', false)
    .order('score', { ascending: false });

  if (tErr) { const e = dbError(tErr); return res.status(e.httpStatus).json({ error: e.message }); }

  const top3 = (allEntries ?? []).slice(0, 3);

  // Encerra a temporada
  const { error: closeErr } = await supabase
    .from('seasons')
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq('id', seasonId);

  if (closeErr) { const e = dbError(closeErr); return res.status(e.httpStatus).json({ error: e.message }); }

  // Arquiva o top 3 no Hall da Fama
  type EntryRow = { player_id: number | null; name: string; character_name: string | null; days: number; kills: number; score: number };

  if (top3.length > 0) {
    const hofRows = (top3 as EntryRow[]).map((e, i) => ({
      season_id:      seasonId,
      player_id:      e.player_id ?? null,
      entry_name:     e.name,
      character_name: e.character_name ?? null,
      position:       i + 1,
      days:           e.days,
      kills:          e.kills,
      score:          e.score,
    }));

    const { error: hofErr } = await supabase.from('hall_of_fame').insert(hofRows);
    if (hofErr) { const e = dbError(hofErr); return res.status(e.httpStatus).json({ error: e.message }); }
  }

  res.json({ ok: true, archived: top3.length });
});

export default router;

import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const limit  = Math.min(parseInt(String(req.query.limit  ?? '30'), 10) || 30, 100);
  const before = req.query.before ? parseInt(String(req.query.before), 10) : null;

  let q = supabase
    .from('journal_events')
    .select('id, type, player_id, player_nick, char_name, data, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before && !isNaN(before)) {
    q = q.lt('id', before);
  }

  const { data, error } = await q;

  if (error) {
    res.status(500).json({ error: 'Erro ao buscar jornal.' });
    return;
  }

  res.json({ events: data ?? [] });
});

export default router;

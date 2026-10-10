import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { config } from '../config';
import { isHiddenJournalEvent, type DisqualifiedRun } from '../lib/journalFilter';

const router = Router();

type JournalRow = {
  id: number; type: string; player_id: number | null; player_nick: string;
  char_name: string | null; data: unknown; created_at: string;
};

// Eventos de runs desclassificadas ficam fora do Jornal (v4.29.4, lib/journalFilter.ts).
// Busca em lotes até completar a página, para um trecho só de eventos escondidos não
// devolver página vazia (o frontend pagina pelo `before` = id do último evento).
const MAX_BATCHES = 5;

router.get('/', async (req: Request, res: Response) => {
  const limit  = Math.min(parseInt(String(req.query.limit  ?? '30'), 10) || 30, 100);
  let before   = req.query.before ? parseInt(String(req.query.before), 10) : null;

  const { data: dqRows, error: dqError } = await supabase
    .from(config.tableName)
    .select('player_id, character_name, run_started_at, created_at')
    .eq('sandbox_ok', false)
    .is('deleted_at', null);
  if (dqError) {
    res.status(500).json({ error: 'Erro ao buscar jornal.' });
    return;
  }
  const disqualified = (dqRows ?? []) as DisqualifiedRun[];

  const events: JournalRow[] = [];
  for (let batch = 0; batch < MAX_BATCHES && events.length < limit; batch++) {
    let q = supabase
      .from('journal_events')
      .select('id, type, player_id, player_nick, char_name, data, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (before && !isNaN(before)) q = q.lt('id', before);

    const { data, error } = await q;
    if (error) {
      res.status(500).json({ error: 'Erro ao buscar jornal.' });
      return;
    }
    const rows = (data ?? []) as JournalRow[];
    for (const ev of rows) {
      if (events.length >= limit) break;
      if (!isHiddenJournalEvent(ev, disqualified)) events.push(ev);
    }
    if (rows.length < limit) break;               // acabaram os eventos
    before = Number(rows[rows.length - 1]!.id);   // próximo lote continua de onde parou
  }

  res.json({ events });
});

export default router;

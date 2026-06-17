import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requireModerator } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';
import type { PlayerStatus } from '../types';

const router = Router();

// POST /players/register — público
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { nick, twitch_url, youtube_url, kick_url, tiktok_url } = req.body as {
    nick?: string;
    twitch_url?:  string;
    youtube_url?: string;
    kick_url?:    string;
    tiktok_url?:  string;
  };

  if (!nick?.trim()) {
    res.status(400).json({ error: 'Nick do jogador é obrigatório.' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('players')
      .insert([{
        nick:        nick.trim(),
        twitch_url:  twitch_url?.trim()  || null,
        youtube_url: youtube_url?.trim() || null,
        kick_url:    kick_url?.trim()    || null,
        tiktok_url:  tiktok_url?.trim()  || null,
        status:      'pending',
      }])
      .select()
      .single();

    if (error) {
      const { httpStatus, message } = dbError(error);
      const msg = error.code === '23505' ? 'Este nick já está cadastrado.' : message;
      res.status(httpStatus).json({ error: msg });
      return;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('[POST /players/register] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao salvar cadastro. Tente novamente.' });
  }
});

// GET /players?status=pending|approved|rejected|all — moderador
router.get('/', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const statusParam = typeof req.query.status === 'string' ? req.query.status : 'all';

  try {
    let query = supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    const { data, error } = await query;
    if (error) {
      const { httpStatus, message } = dbError(error);
      res.status(httpStatus).json({ error: message });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('[GET /players] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar jogadores.' });
  }
});

// PATCH /players/:id/status — moderador
router.patch('/:id/status', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido.' });
    return;
  }

  const { status } = req.body as { status?: PlayerStatus };
  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Status deve ser "approved" ou "rejected".' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const { httpStatus, message } = dbError(error);
      res.status(httpStatus).json({ error: message });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/status] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar status do jogador.' });
  }
});

export default router;

import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requireModerator } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';
import type { PlayerStatus } from '../types';

const router = Router();

// GET /players/:id — público: retorna dados do jogador + todas as entradas dele no rank
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const [playerRes, entriesRes] = await Promise.all([
    supabase
      .from('players')
      .select('id, nick, twitch_url, youtube_url, kick_url, tiktok_url')
      .eq('id', id)
      .single(),
    supabase
      .from('entries')
      .select('*')
      .eq('player_id', id)
      .order('score', { ascending: false }),
  ]);

  if (playerRes.error || !playerRes.data) {
    res.status(404).json({ error: 'Jogador não encontrado.' });
    return;
  }

  res.json({ player: playerRes.data, entries: entriesRes.data ?? [] });
});

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
        blocked:     false,
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

// GET /players?status=pending|approved|rejected|blocked|deleted|all — moderador
router.get('/', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const statusParam = typeof req.query.status === 'string' ? req.query.status : 'all';

  try {
    let query = supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusParam === 'deleted') {
      query = query.not('deleted_at', 'is', null);
    } else if (statusParam === 'blocked') {
      query = query.eq('blocked', true).is('deleted_at', null);
    } else if (statusParam === 'all') {
      query = query.is('deleted_at', null);
    } else {
      query = query.eq('status', statusParam as PlayerStatus).is('deleted_at', null);
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

// PATCH /players/:id/block — moderador
router.patch('/:id/block', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ blocked: true })
      .eq('id', id)
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/block] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao bloquear jogador.' });
  }
});

// PATCH /players/:id/unblock — moderador
router.patch('/:id/unblock', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ blocked: false })
      .eq('id', id)
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/unblock] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao desbloquear jogador.' });
  }
});

// PATCH /players/:id/links — moderador: atualiza links de canais do jogador
router.patch('/:id/links', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { twitch_url, youtube_url, kick_url, tiktok_url } = req.body as {
    twitch_url?:  string | null;
    youtube_url?: string | null;
    kick_url?:    string | null;
    tiktok_url?:  string | null;
  };

  const sanitize = (url?: string | null): string | null => {
    if (!url?.trim()) return null;
    const trimmed = url.trim();
    return /^https?:\/\/.+/.test(trimmed) ? trimmed : null;
  };

  try {
    const { data, error } = await supabase
      .from('players')
      .update({
        twitch_url:  sanitize(twitch_url),
        youtube_url: sanitize(youtube_url),
        kick_url:    sanitize(kick_url),
        tiktok_url:  sanitize(tiktok_url),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/links] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar links do jogador.' });
  }
});

// PATCH /players/:id/delete — moderador: soft-delete
router.patch('/:id/delete', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/delete] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao excluir jogador.' });
  }
});

// PATCH /players/:id/restore — moderador: restaura soft-delete
router.patch('/:id/restore', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('players')
      .update({ deleted_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /players/:id/restore] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao restaurar jogador.' });
  }
});

export default router;

import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { parsePzrCode } from '../lib/decoder';
import { dbError } from '../lib/errors';
import { computeScore } from '../lib/scoring';
import { requireModerator } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';
import { config } from '../config';
import type { Player, Objectives } from '../types';

const router = Router();

const SORT_COLS: Record<string, string> = {
  days:  'days',
  kills: 'kills',
  time:  'time_raw',
  score: 'score',
};

// GET /entries?sort=days|kills|time — público
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const col = SORT_COLS[typeof req.query.sort === 'string' ? req.query.sort : ''] ?? 'score';

  const { data, error } = await supabase
    .from(config.tableName)
    .select('*')
    .order(col, { ascending: false });

  if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
  res.json(data);
});

// POST /entries — moderador: valida código + insere entrada
router.post('/', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const { player_id, code, live_url, objectives } = req.body as {
    player_id?:  number;
    code?:       string;
    live_url?:   string;
    objectives?: Objectives;
  };

  if (!player_id || typeof player_id !== 'number') {
    res.status(400).json({ error: 'player_id é obrigatório.' });
    return;
  }
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Código é obrigatório.' });
    return;
  }

  const decoded = parsePzrCode(code);
  if (!decoded) {
    res.status(400).json({ error: 'Código inválido ou corrompido.' });
    return;
  }

  // Busca o nick do jogador aprovado
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, nick, status, blocked')
    .eq('id', player_id)
    .single();

  if (playerError || !player) {
    res.status(404).json({ error: 'Jogador não encontrado.' });
    return;
  }
  if ((player as Player).status !== 'approved') {
    res.status(400).json({ error: 'Jogador não está aprovado no ranking.' });
    return;
  }
  if ((player as Player & { blocked: boolean }).blocked) {
    res.status(403).json({ error: 'Jogador está bloqueado e não pode ser atualizado no ranking.' });
    return;
  }

  // Sandbox inválido: salva a entrada marcada como desclassificada (score=0, sandbox_ok=false)
  // para que o rank exiba o badge "Desclassificado". Não rejeita — o bloqueio de progresso
  // ocorre via score 0 e via exibição pública do status.
  const safeObjectives = decoded.sandboxOk ? (objectives ?? null) : null;
  const entry = {
    player_id,
    moderator_id:   req.userId,
    name:           (player as Player).nick,
    character_name: decoded.characterName,
    profession:     decoded.profession,
    days:           decoded.days,
    time_raw:       decoded.timeRaw,
    time_str:       decoded.timeStr,
    kills:          decoded.kills,
    skills:         decoded.skills.join(', ') || null,
    live_url:       live_url?.trim() || null,
    is_alive:       decoded.isAlive,
    sandbox_ok:     decoded.sandboxOk,
    objectives:     safeObjectives,
    score:          decoded.sandboxOk ? computeScore(decoded.kills, safeObjectives) : 0,
  };

  // Upsert: mesmo personagem → atualiza; personagem diferente → cria nova entrada
  const { data: existing } = await supabase
    .from(config.tableName)
    .select('id')
    .eq('player_id', player_id)
    .eq('character_name', decoded.characterName)
    .maybeSingle();

  let data, error;
  if (existing) {
    ({ data, error } = await supabase
      .from(config.tableName)
      .update(entry)
      .eq('id', (existing as { id: number }).id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from(config.tableName)
      .insert([entry])
      .select()
      .single());
  }

  if (error) { res.status(500).json({ error: dbError(error).message }); return; }
  res.status(existing ? 200 : 201).json(data);
});

// DELETE /entries/:id — moderador
router.delete('/:id', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { data: existing, error: fetchError } = await supabase
    .from(config.tableName)
    .select('id, moderator_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) { res.status(404).json({ error: 'Entrada não encontrada.' }); return; }

  // Somente o moderador que criou ou o master pode deletar
  const row = existing as { id: number; moderator_id: string };
  if (req.modRole !== 'master' && row.moderator_id !== req.userId) {
    res.status(403).json({ error: 'Sem permissão para remover esta entrada.' });
    return;
  }

  const { error } = await supabase.from(config.tableName).delete().eq('id', id);
  if (error) { res.status(500).json({ error: dbError(error).message }); return; }
  res.status(204).send();
});

export default router;

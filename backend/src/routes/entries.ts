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

  const [entriesRes, deletedRes] = await Promise.all([
    supabase.from(config.tableName).select('*').order(col, { ascending: false }),
    supabase.from('players').select('id').not('deleted_at', 'is', null),
  ]);

  if (entriesRes.error) { const e = dbError(entriesRes.error); res.status(e.httpStatus).json({ error: e.message }); return; }

  const deletedIds = new Set(((deletedRes.data ?? []) as { id: number }[]).map(p => p.id));
  const visible = (entriesRes.data ?? []).filter((e: { player_id: number | null }) =>
    !e.player_id || !deletedIds.has(e.player_id),
  );

  res.json(visible);
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
  if ((player as Player).deleted_at) {
    res.status(403).json({ error: 'Jogador foi excluído do ranking.' });
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
    traits:         decoded.traits.join(',') || null,
    objectives:     safeObjectives,
    score:          decoded.sandboxOk ? computeScore(decoded.kills, safeObjectives) : 0,
    updated_at:     new Date().toISOString(),
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

// PATCH /entries/:id/status — moderador: altera is_alive e/ou sandbox_ok manualmente
router.patch('/:id/status', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { is_alive, sandbox_ok } = req.body as { is_alive?: boolean; sandbox_ok?: boolean };
  if (is_alive === undefined && sandbox_ok === undefined) {
    res.status(400).json({ error: 'Informe is_alive e/ou sandbox_ok.' });
    return;
  }

  const { data: existing, error: fetchError } = await supabase
    .from(config.tableName)
    .select('id, score, kills, objectives')
    .eq('id', id)
    .single();

  if (fetchError || !existing) { res.status(404).json({ error: 'Entrada não encontrada.' }); return; }

  const row = existing as { id: number; score: number; kills: number; objectives: Objectives | null };
  const patch: Record<string, unknown> = {};
  if (is_alive  !== undefined) patch.is_alive  = is_alive;
  if (sandbox_ok !== undefined) {
    patch.sandbox_ok = sandbox_ok;
    // Ao desclassificar manualmente: zera score. Ao reclassificar: recalcula.
    patch.score = sandbox_ok ? computeScore(row.kills, row.objectives) : 0;
  }
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(config.tableName)
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: dbError(error).message }); return; }
  res.json(data);
});

// PATCH /entries/:id/objectives — moderador: atualiza objetivos e recalcula score
router.patch('/:id/objectives', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { objectives } = req.body as { objectives: Objectives };
  if (!objectives || typeof objectives !== 'object') {
    res.status(400).json({ error: 'Objetivos inválidos.' }); return;
  }

  const { data: existing, error: fetchError } = await supabase
    .from(config.tableName)
    .select('id, kills, sandbox_ok')
    .eq('id', id)
    .single();

  if (fetchError || !existing) { res.status(404).json({ error: 'Entrada não encontrada.' }); return; }

  const row = existing as { id: number; kills: number; sandbox_ok: boolean };
  const newScore = row.sandbox_ok !== false ? computeScore(row.kills, objectives) : 0;

  const { data, error } = await supabase
    .from(config.tableName)
    .update({ objectives, score: newScore, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: dbError(error).message }); return; }
  res.json(data);
});

// DELETE /entries/:id — moderador
router.delete('/:id', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { data: existing, error: fetchError } = await supabase
    .from(config.tableName)
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) { res.status(404).json({ error: 'Entrada não encontrada.' }); return; }

  const { error } = await supabase.from(config.tableName).delete().eq('id', id);
  if (error) { res.status(500).json({ error: dbError(error).message }); return; }
  res.status(204).send();
});

export default router;

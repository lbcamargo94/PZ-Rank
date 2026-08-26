import { Router } from 'express';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabase';
import { parsePzrCode } from '../lib/decoder';
import { dbError } from '../lib/errors';
import { computeScore, countSkills10 } from '../lib/scoring';
import { requireModerator } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';
import { config } from '../config';
import type { Player, Objectives } from '../types';

const PUBLIC_ENTRY_COLUMNS = [
  'id', 'player_id', 'name', 'character_name', 'profession',
  'days', 'time_raw', 'time_str', 'kills', 'skills', 'live_url',
  'is_alive', 'sandbox_ok', 'traits', 'objectives', 'score', 'record_score',
  'disqualification_reason', 'disqualified_at', 'deleted_at', 'updated_at',
  'no_live_streak',
].join(', ');

function isModRequest(req: Request): boolean {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  try {
    const payload = jwt.verify(auth.slice(7), config.jwtSecret);
    return typeof payload === 'object' && payload !== null && 'role' in payload;
  } catch { return false; }
}

const router = Router();

const SORT_COLS: Record<string, string> = {
  days:  'days',
  kills: 'kills',
  time:  'time_raw',
  score: 'score',
};

// GET /entries?sort=days|kills|time&all=true — público
// ?all=true: inclui entries soft-deleted e de players excluídos (usado na aba Records)
// Moderadores autenticados recebem campos extras (flagged_reason, sandbox_config, etc.)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const col      = SORT_COLS[typeof req.query.sort === 'string' ? req.query.sort : ''] ?? 'score';
  const allParam = req.query.all === 'true';
  const isMod    = isModRequest(req);
  const cols     = isMod ? '*' : PUBLIC_ENTRY_COLUMNS;

  if (allParam) {
    const [entriesRes, playersRes] = await Promise.all([
      supabase.from(config.tableName).select(cols).order(col, { ascending: false }),
      supabase.from('players').select('id, is_test_mod'),
    ]);
    if (entriesRes.error) { const e = dbError(entriesRes.error); res.status(e.httpStatus).json({ error: e.message, error_code: 'DB_ERROR' }); return; }
    const testModIds = new Set(((playersRes.data ?? []) as { id: number; is_test_mod: boolean | number }[])
      .filter(p => p.is_test_mod).map(p => p.id));
    const all = (entriesRes.data ?? []).map((e: { player_id: number | null }) => ({
      ...e,
      is_test_mod: e.player_id != null && testModIds.has(e.player_id),
    }));
    res.setHeader('Cache-Control', 'no-store');
    res.json(all);
    return;
  }

  const [entriesRes, playersRes] = await Promise.all([
    supabase.from(config.tableName).select(cols).is('deleted_at', null).order(col, { ascending: false }),
    supabase.from('players').select('id, deleted_at, is_test_mod'),
  ]);

  if (entriesRes.error) { const e = dbError(entriesRes.error); res.status(e.httpStatus).json({ error: e.message, error_code: 'DB_ERROR' }); return; }

  type PlayerRow = { id: number; deleted_at: string | null; is_test_mod: boolean | number };
  const players = (playersRes.data ?? []) as PlayerRow[];
  const deletedIds = new Set(players.filter(p => p.deleted_at != null).map(p => p.id));
  const testModIds = new Set(players.filter(p => p.is_test_mod).map(p => p.id));

  const visible = (entriesRes.data ?? [])
    .filter((e: { player_id: number | null }) => !e.player_id || !deletedIds.has(e.player_id))
    .map((e: { player_id: number | null }) => ({
      ...e,
      is_test_mod: e.player_id != null && testModIds.has(e.player_id),
    }));

  if (isMod) {
    res.setHeader('Cache-Control', 'no-store');
  } else {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  }
  res.json(visible);
});

// GET /entries/top10 — público: só nome/personagem/pontuação dos 10 primeiros
// colocados, pra telas de resumo (prévia da home, overlay de OBS) que não
// precisam da linha inteira (skills/traits/objectives) — GET /entries sozinho
// pesa ~660KB com o volume atual de entries; isso aqui fica na casa de 1KB.
router.get('/top10', async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from(config.tableName)
    .select('id, player_id, name, character_name, score')
    .eq('is_alive', true)
    .eq('sandbox_ok', true)
    .is('deleted_at', null)
    .order('score', { ascending: false })
    .limit(10);

  if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message, error_code: 'DB_ERROR' }); return; }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  res.json(data ?? []);
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

  // Busca entrada existente para preservar objectives, disqualified_at e live_url no upsert.
  // objectives são gerenciados exclusivamente via PATCH /entries/:id/objectives e nunca
  // sobrescritos por este endpoint — isso evita que uma atualização de código apague bases
  // confirmadas pelo moderador, mesmo em caso de race condition no carregamento do painel.
  const { data: existing, error: existingError } = await supabase
    .from(config.tableName)
    .select('id, disqualified_at, objectives, live_url')
    .eq('player_id', player_id)
    .eq('character_name', decoded.characterName)
    .maybeSingle();

  // Erro indica múltiplas linhas para o mesmo personagem (race condition anterior).
  // Bloqueia novo INSERT para não agravar — moderador master deve limpar os duplicados.
  if (existingError) {
    res.status(409).json({ error: 'Entrada duplicada para este personagem. Remova os duplicados via painel antes de atualizar.' });
    return;
  }

  const existingRow = existing as { id: number; disqualified_at?: string | null; objectives?: Objectives | null; live_url?: string | null } | null;

  // Para entradas existentes: preserva os objectives do DB (nunca sobrescreve com o form).
  // Para entradas novas: usa os objectives enviados pelo frontend (pode ser null).
  const preservedObjectives = decoded.sandboxOk
    ? (existingRow ? (existingRow.objectives as Objectives | null) : (objectives ?? null))
    : null;

  // Determina disqualified_at:
  // - Se sandbox_ok: limpa (null)
  // - Se !sandbox_ok e já havia data: preserva (contador não reinicia)
  // - Se !sandbox_ok e sem data: registra agora
  let disqualifiedAt: string | null = null;
  if (!decoded.sandboxOk) {
    disqualifiedAt = existingRow?.disqualified_at ?? new Date().toISOString();
  }

  const entry = {
    player_id,
    moderator_id:            req.userId,
    name:                    (player as Player).nick,
    character_name:          decoded.characterName,
    profession:              decoded.profession,
    days:                    decoded.days,
    time_raw:                decoded.timeRaw,
    time_str:                decoded.timeStr,
    kills:                   decoded.kills,
    skills:                  decoded.skills.join(', ') || null,
    live_url:                live_url?.trim() || existingRow?.live_url || null,
    is_alive:                decoded.isAlive,
    sandbox_ok:              decoded.sandboxOk,
    traits:                  decoded.traits.join(',') || null,
    objectives:              preservedObjectives,
    score:                   decoded.sandboxOk ? computeScore(decoded.kills, Object.values(decoded.skillLevels).filter(l => l === 10).length, preservedObjectives) : 0,
    disqualification_reason: !decoded.sandboxOk
      ? (decoded.disqualificationReason ?? 'sandbox')
      : null,
    disqualified_at:         disqualifiedAt,
    updated_at:              new Date().toISOString(),
  };

  let data, error;
  if (existingRow) {
    ({ data, error } = await supabase
      .from(config.tableName)
      .update(entry)
      .eq('id', existingRow.id)
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
  res.status(existingRow ? 200 : 201).json(data);
});

// PATCH /entries/:id/status — moderador: altera is_alive e/ou sandbox_ok manualmente
// Desclassificação manual (sandbox_ok: false) exige um motivo (note) — fica registrado
// junto com o login do moderador para auditoria (mesmo padrão do banimento de jogadores).
router.patch('/:id/status', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { is_alive, sandbox_ok, note } = req.body as { is_alive?: boolean; sandbox_ok?: boolean; note?: string };
  if (is_alive === undefined && sandbox_ok === undefined) {
    res.status(400).json({ error: 'Informe is_alive e/ou sandbox_ok.' });
    return;
  }
  if (sandbox_ok === false && !note?.trim()) {
    res.status(400).json({ error: 'Motivo da desclassificação é obrigatório.' });
    return;
  }

  const { data: existing, error: fetchError } = await supabase
    .from(config.tableName)
    .select('id, score, kills, skills, objectives, disqualified_at')
    .eq('id', id)
    .single();

  if (fetchError || !existing) { res.status(404).json({ error: 'Entrada não encontrada.' }); return; }

  const row = existing as { id: number; score: number; kills: number; skills: string | null; objectives: Objectives | null; disqualified_at?: string | null };
  const patch: Record<string, unknown> = {};
  if (is_alive  !== undefined) {
    patch.is_alive = is_alive;
    // Ao marcar como morto por qualquer via, limpa o marcador de conflito
    if (!is_alive) {
      patch.pending_new_character       = null;
      patch.pending_new_character_since = null;
    }
  }
  if (sandbox_ok !== undefined) {
    patch.sandbox_ok = sandbox_ok;
    // Ao desclassificar: registra data se ainda não havia. Ao reclassificar: limpa.
    if (!sandbox_ok) {
      patch.disqualified_at         = row.disqualified_at ?? new Date().toISOString();
      patch.disqualification_reason = 'manual';
      patch.disqualification_note   = note!.trim();

      const { data: mod } = await supabase
        .from('moderators')
        .select('login')
        .eq('id', req.userId!)
        .single();
      patch.disqualified_by = mod?.login ?? req.userId ?? 'moderador';
    } else {
      patch.disqualified_at         = null;
      patch.disqualification_reason = null;
      patch.disqualification_note   = null;
      patch.disqualified_by         = null;
    }
    // Ao desclassificar manualmente: zera score. Ao reclassificar: recalcula.
    patch.score = sandbox_ok ? computeScore(row.kills, countSkills10(row.skills), row.objectives) : 0;
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
    .select('id, kills, skills, sandbox_ok')
    .eq('id', id)
    .single();

  if (fetchError || !existing) { res.status(404).json({ error: 'Entrada não encontrada.' }); return; }

  const row = existing as { id: number; kills: number; skills: string | null; sandbox_ok: boolean };
  const newScore = row.sandbox_ok !== false ? computeScore(row.kills, countSkills10(row.skills), objectives) : 0;

  const { data, error } = await supabase
    .from(config.tableName)
    .update({ objectives, score: newScore, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: dbError(error).message }); return; }
  res.json(data);
});

// PATCH /entries/:id/confirm-death — moderador: confirma morte não registrada
// Seta is_alive=false e score=0, liberando o jogador para iniciar nova run do zero.
// Difere do PATCH /status: também zera o score (penalidade por morte não registrada).
router.patch('/:id/confirm-death', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { data: existing, error: fetchError } = await supabase
    .from(config.tableName)
    .select('id, is_alive, score, record_score')
    .eq('id', id)
    .single();

  if (fetchError || !existing) { res.status(404).json({ error: 'Entrada não encontrada.' }); return; }
  if (!(existing as { is_alive: boolean }).is_alive) {
    res.status(400).json({ error: 'Personagem já está morto.' });
    return;
  }

  const row = existing as { id: number; is_alive: boolean; score: number; record_score: number };
  const newRecord = Math.max(row.score, row.record_score ?? 0);

  const { data, error } = await supabase
    .from(config.tableName)
    .update({
      is_alive:                    false,
      score:                       0,
      record_score:                newRecord,
      pending_new_character:       null,
      pending_new_character_since: null,
      updated_at:                  new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: dbError(error).message }); return; }
  res.json(data);
});

// DELETE /entries/:id — moderador (soft-delete: preserva o histórico na aba Records)
router.delete('/:id', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { data: existing, error: fetchError } = await supabase
    .from(config.tableName)
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) { res.status(404).json({ error: 'Entrada não encontrada.' }); return; }

  const { error } = await supabase
    .from(config.tableName)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { res.status(500).json({ error: dbError(error).message }); return; }
  res.status(204).send();
});

export default router;
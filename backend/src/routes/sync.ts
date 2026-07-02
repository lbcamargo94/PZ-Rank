import { Router } from 'express';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../supabase';
import { parsePzrCode } from '../lib/decoder';
import { dbError } from '../lib/errors';
import { computeScore } from '../lib/scoring';
import { config } from '../config';
import type { Objectives } from '../types';

const router = Router();

// ── Rate limiters ──────────────────────────────────────────────────────────

// Lookup é o endpoint mais sensível: expõe player_token por nick público.
// 10 req/hora por IP reduz enumeração em massa sem bloquear uso legítimo do mod.
const lookupLimiter = rateLimit({
  windowMs:         60 * 60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
});

// Sync principal: limita gravações no banco de rank.
// 60 req/15min = 4/min — comportamento típico: 1 sync a cada 5 kills + periódico a cada 5 min.
const syncLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              60,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Muitas requisições de sync. Aguarde alguns minutos.' },
});

// Sandbox é sempre chamado logo após um /sync/update bem-sucedido (par obrigatório).
// Orçamento independente para não consumir o limite do rank. Best-effort: falhas são ignoradas.
const sandboxLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              120,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Muitas requisições de sandbox. Aguarde alguns minutos.' },
});

// ── Limites de progressão (anti-cheat básico) ──────────────────────────────
// Detecta valores claramente impossíveis antes de persistir no banco.
// 500k kills: cobre jogadores com alta densidade de zumbis em runs muito longas.
const MAX_KILLS = 500_000;
const MAX_DAYS  = 36_500; // ~100 anos em dias de jogo

// GET /sync/lookup?nick=<nick> — público (rate limited: 10/hora por IP)
// Retorna player_token se o jogador está aprovado e ativo.
// Usado pelo mod para obter o token na primeira execução.
router.get('/lookup', lookupLimiter, async (req: Request, res: Response): Promise<void> => {
  const nick = typeof req.query.nick === 'string' ? req.query.nick.trim() : '';
  if (!nick) {
    res.status(400).json({ error: 'nick é obrigatório.' });
    return;
  }

  const { data, error } = await supabase
    .from('players')
    .select('id, nick, player_token, status, blocked')
    .ilike('nick', nick)
    .maybeSingle();

  if (error || !data) {
    res.status(404).json({ error: 'Jogador não encontrado.' });
    return;
  }
  if (data.status !== 'approved') {
    res.status(403).json({ error: 'Jogador aguardando aprovação.' });
    return;
  }
  if (data.blocked) {
    res.status(403).json({ error: 'Jogador bloqueado.' });
    return;
  }
  if (!data.player_token) {
    res.status(404).json({ error: 'Token não disponível. Execute a migration v8.' });
    return;
  }

  res.json({ player_token: data.player_token, player_id: data.id });
});

// POST /sync/update — público, autenticado por player_token (rate limited: 30/15min por IP)
// Enviado pelo mod automaticamente (sem precisar de moderador).
// Preserva objectives e live_url de entradas existentes.
router.post('/update', syncLimiter, async (req: Request, res: Response): Promise<void> => {
  const { player_token, code } = req.body as {
    player_token?: string;
    code?:         string;
  };

  if (!player_token || !code) {
    res.status(400).json({ error: 'player_token e code são obrigatórios.' });
    return;
  }

  // Valida token
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, nick, status, blocked')
    .eq('player_token', player_token)
    .maybeSingle();

  if (playerError || !player) {
    res.status(401).json({ error: 'Token inválido.' });
    return;
  }
  if (player.status !== 'approved') {
    res.status(403).json({ error: 'Jogador aguardando aprovação.' });
    return;
  }
  if (player.blocked) {
    res.status(403).json({ error: 'Jogador bloqueado.' });
    return;
  }

  // Decodifica o código do mod
  const decoded = parsePzrCode(code);
  if (!decoded) {
    res.status(400).json({ error: 'Código inválido ou corrompido.' });
    return;
  }

  // Limites de progressão — rejeita valores impossíveis (anti-cheat básico)
  if (decoded.kills > MAX_KILLS || decoded.kills < 0) {
    res.status(400).json({ error: 'Valor de kills fora do intervalo permitido.' });
    return;
  }
  if (decoded.days > MAX_DAYS || decoded.days < 0) {
    res.status(400).json({ error: 'Valor de dias fora do intervalo permitido.' });
    return;
  }

  // Busca entrada existente para preservar objectives, live_url e estado de desclassificação
  const { data: existing } = await supabase
    .from(config.tableName)
    .select('id, objectives, live_url, sandbox_ok')
    .eq('player_id', player.id)
    .eq('character_name', decoded.characterName)
    .maybeSingle();

  // Se já está desclassificado, descarta qualquer atualização futura
  if (existing && existing.sandbox_ok === false) {
    res.status(200).json({
      success:        true,
      character_name: decoded.characterName,
      score:          0,
      is_alive:       (existing as { is_alive?: boolean }).is_alive ?? false,
      disqualified:   true,
    });
    return;
  }

  const existingObjectives = (existing?.objectives as Objectives | null) ?? null;

  // Desclassificação: preserva os dados legítimos do último estado classificado.
  // Só atualiza sandbox_ok, is_alive e zera o score — kills/dias/skills não são sobrescritos.
  if (!decoded.sandboxOk && existing) {
    const { data, error } = await supabase
      .from(config.tableName)
      .update({ sandbox_ok: false, is_alive: decoded.isAlive, score: 0 })
      .eq('id', (existing as { id: number }).id)
      .select('id, character_name, score, is_alive')
      .single();

    if (error) {
      res.status(500).json({ error: dbError(error).message });
      return;
    }
    res.status(200).json({
      success:        true,
      character_name: (data as { character_name: string }).character_name,
      score:          0,
      is_alive:       (data as { is_alive: boolean }).is_alive,
    });
    return;
  }

  const score = computeScore(decoded.kills, existingObjectives);

  const entry = {
    player_id:      player.id,
    moderator_id:   null,
    name:           player.nick,
    character_name: decoded.characterName,
    profession:     decoded.profession,
    days:           decoded.days,
    time_raw:       decoded.timeRaw,
    time_str:       decoded.timeStr,
    kills:          decoded.kills,
    skills:         decoded.skills.join(', ') || null,
    live_url:       existing?.live_url ?? null,
    is_alive:       decoded.isAlive,
    sandbox_ok:     true,
    traits:         decoded.traits.length > 0 ? decoded.traits.join(',') : null,
    objectives:     existingObjectives,
    score,
    updated_at:     new Date().toISOString(),
  };

  let data, error;
  if (existing) {
    ({ data, error } = await supabase
      .from(config.tableName)
      .update(entry)
      .eq('id', (existing as { id: number }).id)
      .select('id, character_name, score, is_alive')
      .single());
  } else {
    ({ data, error } = await supabase
      .from(config.tableName)
      .insert([entry])
      .select('id, character_name, score, is_alive')
      .single());
  }

  if (error) {
    res.status(500).json({ error: dbError(error).message });
    return;
  }

  const finalScore = (data as { score: number }).score;

  // Posição no ranking: contagem de entradas com score mais alto (best-effort)
  const { count: rankCount, error: rankError } = await supabase
    .from(config.tableName)
    .select('*', { count: 'exact', head: true })
    .gt('score', finalScore);

  res.status(existing ? 200 : 201).json({
    success:        true,
    character_name: (data as { character_name: string }).character_name,
    score:          finalScore,
    is_alive:       (data as { is_alive: boolean }).is_alive,
    rank_position:  !rankError && rankCount !== null ? rankCount + 1 : null,
  });
});


// Allowlist de chaves válidas no sandbox_config (#8 — validação de schema)
// O Companion envia o JSON completo gerado pelo mod Lua, cujo envelope tem
// exatamente 5 chaves de topo: type, version, character, timestamp, sandbox.
// O objeto 'sandbox' contém as categorias do SandboxVars — é armazenado
// como JSON em coluna TEXT/JSONB; não há risco de SQL injection nesse nível.
const SANDBOX_ALLOWED_KEYS = new Set(['type', 'version', 'character', 'timestamp', 'sandbox']);
const SANDBOX_MAX_BYTES    = 256 * 1024; // 256 KB — sanity check anti-bomb

// POST /sync/sandbox — público, autenticado por player_token (rate limited: 30/15min por IP)
// Recebe configuração completa de sandbox para auditoria.
// Independente do rank — falhas não afetam sync do PZRX2.
router.post('/sandbox', sandboxLimiter, async (req: Request, res: Response): Promise<void> => {
  const { player_token, sandbox_config } = req.body as {
    player_token?:   string;
    sandbox_config?: Record<string, unknown>;
  };

  if (!player_token || !sandbox_config || typeof sandbox_config !== 'object' || Array.isArray(sandbox_config)) {
    res.status(400).json({ error: 'player_token e sandbox_config são obrigatórios.' });
    return;
  }

  // Valida envelope do sandbox (#8): apenas as 5 chaves emitidas pelo mod Lua
  const unknownKeys = Object.keys(sandbox_config).filter(k => !SANDBOX_ALLOWED_KEYS.has(k));
  if (unknownKeys.length > 0) {
    res.status(400).json({ error: `Chaves não permitidas em sandbox_config: ${unknownKeys.slice(0, 5).join(', ')}` });
    return;
  }
  // Sanity-check de tamanho para evitar payloads abusivos
  if (Buffer.byteLength(JSON.stringify(sandbox_config)) > SANDBOX_MAX_BYTES) {
    res.status(413).json({ error: 'sandbox_config excede o tamanho máximo permitido.' });
    return;
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, nick, status, blocked')
    .eq('player_token', player_token)
    .maybeSingle();

  if (playerError || !player) { res.status(401).json({ error: 'Token inválido.' }); return; }
  if (player.status !== 'approved') { res.status(403).json({ error: 'Jogador aguardando aprovação.' }); return; }
  if (player.blocked) { res.status(403).json({ error: 'Jogador bloqueado.' }); return; }

  const characterName = typeof sandbox_config.character === 'string' ? sandbox_config.character : null;

  // Busca a entrada do jogador — filtra por personagem se disponível
  let baseQuery = supabase
    .from(config.tableName)
    .select('id')
    .eq('player_id', player.id)
    .order('score', { ascending: false });

  if (characterName) baseQuery = (baseQuery as typeof baseQuery).eq('character_name', characterName);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entry } = await (baseQuery as any).maybeSingle() as { data: { id: number } | null };

  if (!entry) {
    res.status(202).json({ success: true, note: 'Sem entrada para este personagem — sandbox recebido mas não salvo.' });
    return;
  }

  const { error: updateError } = await supabase
    .from(config.tableName)
    .update({ sandbox_config, sandbox_config_updated_at: new Date().toISOString() })
    .eq('id', entry.id);

  if (updateError) { res.status(500).json({ error: dbError(updateError).message }); return; }

  res.status(200).json({ success: true });
});

export default router;
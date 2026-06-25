import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { parsePzrCode } from '../lib/decoder';
import { dbError } from '../lib/errors';
import { computeScore } from '../lib/scoring';
import { config } from '../config';
import type { Objectives } from '../types';

const router = Router();

// GET /sync/lookup?nick=<nick> — público
// Retorna player_token se o jogador está aprovado e ativo.
// Usado pelo mod para obter o token na primeira execução.
router.get('/lookup', async (req: Request, res: Response): Promise<void> => {
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

  res.json({ player_token: data.player_token });
});

// POST /sync/update — público, autenticado por player_token
// Enviado pelo mod automaticamente (sem precisar de moderador).
// Preserva objectives e live_url de entradas existentes.
router.post('/update', async (req: Request, res: Response): Promise<void> => {
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

  res.status(existing ? 200 : 201).json({
    success:        true,
    character_name: (data as { character_name: string }).character_name,
    score:          (data as { score: number }).score,
    is_alive:       (data as { is_alive: boolean }).is_alive,
  });
});


// POST /sync/sandbox — público, autenticado por player_token
// Recebe configuração completa de sandbox para auditoria.
// Independente do rank — falhas não afetam sync do PZRX2.
router.post('/sandbox', async (req: Request, res: Response): Promise<void> => {
  const { player_token, sandbox_config } = req.body as {
    player_token?:   string;
    sandbox_config?: Record<string, unknown>;
  };

  if (!player_token || !sandbox_config || typeof sandbox_config !== 'object') {
    res.status(400).json({ error: 'player_token e sandbox_config são obrigatórios.' });
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
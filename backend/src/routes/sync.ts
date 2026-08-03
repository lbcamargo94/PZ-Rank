import { Router } from 'express';
import type { Request, Response } from 'express';
import { createHmac } from 'crypto';
import rateLimit from 'express-rate-limit';

function isVersionAtLeast(version: string | null, minimum: string): boolean {
  if (!version) return false;
  const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
  const a = parse(version);
  const b = parse(minimum);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return true;
}
import { supabase } from '../supabase';
import { parsePzrCode } from '../lib/decoder';
import { dbError } from '../lib/errors';
import { computeScore } from '../lib/scoring';
import { evaluateAchievements, type ExtendedStats } from '../lib/achievements';
import { processHeatmapDelta } from '../lib/heatmap';
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
// 800k kills: objetivo máximo do campeonato; cobre runs muito longas com alta densidade de zumbis.
const MAX_KILLS            = 800_000;
const MAX_DAYS             = 36_500; // ~100 anos em dias de jogo
const MAX_KILLS_PER_SECOND = 2.0;    // acima disso é fisicamente impossível no PZ

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
  const { player_token, code, disqualification_reason, heatmap_delta } = req.body as {
    player_token?:           string;
    code?:                   string;
    disqualification_reason?: string;
    heatmap_delta?:           unknown[];
  };

  const VALID_REASONS = new Set(['sandbox', 'debug', 'manual']);
  const isValidReason  = (r: string) => VALID_REASONS.has(r);
  const isModsReason   = (r: string | null | undefined) => !!r && (r === 'mods' || r === 'mod_removed' || r.startsWith('mods:'));
  const companionReason = (disqualification_reason && isValidReason(disqualification_reason))
    ? disqualification_reason
    : null;

  if (!player_token || !code) {
    res.status(400).json({ error: 'player_token e code são obrigatórios.' });
    return;
  }

  // Valida token
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, nick, status, blocked, youtube_url')
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
  if (!player.youtube_url?.trim()) {
    res.status(403).json({ error: 'Cadastre o link do seu canal do YouTube no site do rank para enviar atualizações.' });
    return;
  }

  // Decodifica o código do mod
  const decoded = parsePzrCode(code);
  if (!decoded) {
    res.status(400).json({ error: 'Código inválido ou corrompido.' });
    return;
  }

  // ── Verificação de versão do mod ──────────────────────────────────────────
  // Se MIN_MOD_VERSION estiver configurado, rejeita syncs de versões antigas.
  // HTTP 426 (Upgrade Required) — sem escrita no banco, jogador não é desclassificado.
  if (config.minModVersion && !isVersionAtLeast(decoded.modVersion, config.minModVersion)) {
    res.status(426).json({
      error: `Mod desatualizado (${decoded.modVersion ?? 'desconhecido'}). Atualize o mod PZ Community Rank na Oficina da Steam.`,
      outdated_mod:     true,
      required_version: config.minModVersion,
    });
    return;
  }

  // ── Verificação de assinatura HMAC ────────────────────────────────────────
  // O Companion assina cada código com HMAC-SHA256(player_token:code, SYNC_HMAC_SECRET).
  // Se o secret estiver configurado e a assinatura vier presente, ela deve conferir.
  // Syncs sem assinatura (mod antigo ou Companion desatualizado) são aceitos mas logados.
  if (config.syncHmacSecret) {
    const sig = req.headers['x-code-sig'] as string | undefined;
    if (!sig) {
      res.status(400).json({ error: 'Assinatura obrigatória. Atualize o Companion.' });
      return;
    }
    const expected = createHmac('sha256', config.syncHmacSecret)
      .update(`${player_token}:${code}`)
      .digest('hex');
    if (sig !== expected) {
      res.status(400).json({ error: 'Assinatura inválida. Atualize o Companion.' });
      return;
    }
  }

  // ── Verificação de freshness do timestamp ──────────────────────────────────
  // O campo codeTimestamp (campo 11 do payload) é gerado pelo mod no momento da
  // criação do código. Rejeita códigos com mais de 26h (cobre 24h de retry queue)
  // ou com timestamp futuro (mais de 5min de tolerância para skew de relógio).
  if (decoded.codeTimestamp && decoded.codeTimestamp > 0) {
    const nowSec  = Math.floor(Date.now() / 1000);
    const ageSec  = nowSec - decoded.codeTimestamp;
    if (ageSec > 26 * 3600) {
      res.status(400).json({ error: 'Código expirado. Gere um novo sync no jogo.' });
      return;
    }
    if (ageSec < -300) {
      res.status(400).json({ error: 'Timestamp do código inválido (futuro).' });
      return;
    }
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

  // Verifica se há outro personagem vivo vinculado a esta conta (apenas um personagem permitido)
  const { data: conflictEntries } = await supabase
    .from(config.tableName)
    .select('character_name')
    .eq('player_id', player.id)
    .eq('is_alive', true)
    .neq('character_name', decoded.characterName)
    .limit(1);

  if (conflictEntries && conflictEntries.length > 0) {
    res.status(409).json({
      error: `Apenas um personagem por conta é permitido. "${(conflictEntries[0] as { character_name: string }).character_name}" ainda está vivo no rank. Contate um moderador para resolver.`,
    });
    return;
  }

  // Busca entrada existente para preservar objectives, live_url e estado de desclassificação
  const { data: existing, error: existingError } = await supabase
    .from(config.tableName)
    .select('id, objectives, live_url, sandbox_ok, disqualification_reason, kills, time_raw, days, flagged_reason, flagged_at, updated_at, score, character_name, is_alive')
    .eq('player_id', player.id)
    .eq('character_name', decoded.characterName)
    .maybeSingle();

  // Erro indica múltiplas linhas para o mesmo personagem (race condition anterior).
  // Rejeita o sync para não adicionar mais um duplicado — o estado fica congelado
  // até que um moderador master remova as entradas duplicadas.
  if (existingError) {
    res.status(409).json({ error: 'Entrada duplicada detectada. Sync pausado até limpeza pelo moderador.' });
    return;
  }

  type ExistingRow = {
    id: number; kills: number; time_raw: number; days: number;
    flagged_reason: string | null; flagged_at: string | null;
    sandbox_ok: boolean; disqualification_reason: string | null;
    objectives: Objectives | null; live_url: string | null;
    updated_at: string | null;
    score: number; character_name: string; is_alive: boolean;
  };
  const prev = existing as ExistingRow | null;

  // Se já está desclassificado por mods, reabilita automaticamente (mods não desclassificam mais).
  // Para outros motivos (sandbox, debug, manual), mantém a desclassificação.
  // justReactivated=true sinaliza que o baseline de prev (score/kills) não é confiável:
  // o score era 0 por desclassificação, não por progressão legítima — a detecção de
  // anomalias deve ser pulada para este sync para não travar o score em 0.
  let justReactivated = false;
  if (prev && prev.sandbox_ok === false) {
    if (isModsReason(prev.disqualification_reason)) {
      await supabase
        .from(config.tableName)
        .update({ sandbox_ok: true, disqualification_reason: null, disqualified_at: null })
        .eq('id', prev.id);
      justReactivated = true;
    } else {
      res.status(200).json({
        success:        true,
        character_name: decoded.characterName,
        score:          0,
        is_alive:       (existing as { is_alive?: boolean }).is_alive ?? false,
        disqualified:   true,
      });
      return;
    }
  }

  const existingObjectives = (existing?.objectives as Objectives | null) ?? null;

  // ── Detecção de anomalias estatísticas ─────────────────────────────────────
  // Compara submissão atual com o último estado conhecido para detectar
  // progressão impossível (regressão de kills/dias ou ritmo de kills absurdo).
  // Flags ficam gravadas para revisão do moderador — não bloqueiam o sync.
  // Pulado quando justReactivated=true: o prev vem de um estado desclassificado
  // (score=0, kills potencialmente desatualizados), então qualquer comparação
  // geraria falso-positivo e congelaria o score em 0.

  let flaggedReason: string | null = null;
  let flaggedAt:     string | null = null;

  if (prev && decoded.sandboxOk && !justReactivated) {
    // timeRaw (minutos totais) nunca retrocede numa run legítima — se diminuiu,
    // o personagem morreu e iniciou nova partida com o mesmo nome.
    // Usa timeRaw em vez de days para capturar o caso em que ambas as runs
    // arredondam para o mesmo número de dias mas o tempo total é menor.
    const isNewRun = decoded.timeRaw < prev.time_raw;

    if (!isNewRun) {
      if (decoded.kills < prev.kills) {
        flaggedReason = 'kills_regression';
      }
      if (!flaggedReason) {
        const timeDelta  = decoded.timeRaw - prev.time_raw;
        const killsDelta = decoded.kills   - prev.kills;
        if (timeDelta > 0 && killsDelta / timeDelta > MAX_KILLS_PER_SECOND) {
          flaggedReason = 'kills_spike';
        }
      }
    }

    if (flaggedReason) {
      flaggedAt = new Date().toISOString();

      // Código mais antigo que o estado atual — rejeita silenciosamente para não
      // regredir o rank. Retorna 200 para que o Companion descarte da fila de retry.
      if (flaggedReason === 'kills_regression' || flaggedReason === 'code_replay') {
        res.status(200).json({
          success:        true,
          stale:          true,
          character_name: prev.character_name,
          score:          prev.score,
          is_alive:       prev.is_alive,
          rank_position:  null,
        });
        return;
      }
    } else if (!isNewRun && prev.flagged_reason) {
      // Mantém flag anterior até revisão manual do moderador (não carrega flags de runs antigas)
      flaggedReason = prev.flagged_reason;
      flaggedAt     = prev.flagged_at ?? null;
    }
  }

  // Desclassificação: apenas sandbox e debug causam desclassificação.
  // Mods não desclassificam — se decoded.sandboxOk=false por mods (mod antigo), ignora e segue.
  const codeReason = decoded.disqualificationReason;
  if (!decoded.sandboxOk && !isModsReason(codeReason)) {
    // Primeiro sync com sandbox/debug ativo: rejeita sem criar entrada no banco.
    // Sem o && prev anterior, um jogador novo com sandbox podia entrar no rank
    // temporariamente (INSERT com sandbox_ok:true) até o segundo sync corrigir.
    if (!prev) {
      res.status(400).json({ error: 'Sandbox ou modo de depuração ativo. Desative para participar do rank.' });
      return;
    }
    const existingRow = prev as { id: number; disqualification_reason?: string | null };
    const validatedReason = companionReason ?? (codeReason && isValidReason(codeReason) ? codeReason : null) ?? 'sandbox';
    const reasonToStore = existingRow.disqualification_reason ?? validatedReason;
    const { data, error } = await supabase
      .from(config.tableName)
      .update({ sandbox_ok: false, is_alive: decoded.isAlive, score: 0, disqualification_reason: reasonToStore })
      .eq('id', existingRow.id)
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

  const hasExtended = decoded.animalsKilled > 0 || decoded.fishCaught > 0 ||
    decoded.cropsHarvested > 0 || decoded.itemsCrafted > 0 ||
    decoded.housesLooted > 0 || decoded.hoursWithoutSleep > 0 ||
    decoded.treesCut > 0 || decoded.booksRead > 0 ||
    decoded.structuresBuilt > 0 || decoded.cropsPlanted > 0 ||
    decoded.spiffoVisited > 0;

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
    flagged_reason: flaggedReason,
    flagged_at:     flaggedAt,
    updated_at:     new Date().toISOString(),
    // PZRX3: only write when present to avoid overwriting with zeros on PZRX2 syncs
    ...(hasExtended ? {
      animals_killed:      decoded.animalsKilled,
      fish_caught:         decoded.fishCaught,
      crops_harvested:     decoded.cropsHarvested,
      items_crafted:       decoded.itemsCrafted,
      houses_looted:       decoded.housesLooted,
      hours_without_sleep: decoded.hoursWithoutSleep,
      trees_cut:           decoded.treesCut,
      books_read:          decoded.booksRead,
      structures_built:    decoded.structuresBuilt,
      crops_planted:       decoded.cropsPlanted,
      spiffo_visited:      decoded.spiffoVisited,
    } : {}),
  };

  let data, error;
  if (prev) {
    ({ data, error } = await supabase
      .from(config.tableName)
      .update(entry)
      .eq('id', (prev as { id: number }).id)
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

  const finalScore  = (data as { score: number }).score;
  const finalEntryId = (data as { id: number }).id;

  // Fire-and-forget — falha na avaliação não afeta a resposta do sync
  const extStats: ExtendedStats = {
    kills:              decoded.kills,
    days:               decoded.days,
    animalsKilled:      decoded.animalsKilled,
    fishCaught:         decoded.fishCaught,
    cropsHarvested:     decoded.cropsHarvested,
    itemsCrafted:       decoded.itemsCrafted,
    housesLooted:       decoded.housesLooted,
    hoursWithoutSleep:  decoded.hoursWithoutSleep,
    treesCut:           decoded.treesCut,
    booksRead:          decoded.booksRead,
    structuresBuilt:    decoded.structuresBuilt,
    cropsPlanted:       decoded.cropsPlanted,
    spiffoVisited:      decoded.spiffoVisited,
    skillLevels:        decoded.skillLevels,
  };
  void (async () => {
    try {
      await evaluateAchievements(player.id, finalEntryId, extStats);
    } catch {
      await new Promise<void>(r => setTimeout(r, 2000));
      await evaluateAchievements(player.id, finalEntryId, extStats);
    }
  })().catch(e => console.error('[achievements]', e));

  // Heatmap: aceita delta opcional do Companion; obtém season ativa para o UPSERT
  if (heatmap_delta && Array.isArray(heatmap_delta) && heatmap_delta.length > 0) {
    void (async () => {
      const { data: season } = await supabase
        .from('seasons').select('id').eq('is_active', true).maybeSingle();
      if (season) {
        void processHeatmapDelta((season as { id: number }).id, heatmap_delta)
          .catch(e => console.error('[heatmap]', e));
      }
    })();
  }

  // Posição no ranking: contagem de entradas com score mais alto (best-effort)
  const { count: rankCount, error: rankError } = await supabase
    .from(config.tableName)
    .select('*', { count: 'exact', head: true })
    .gt('score', finalScore);

  res.status(prev ? 200 : 201).json({
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

// POST /sync/heartbeat — público, autenticado por player_token
// Enviado pelo Companion quando o PZ está rodando mas o mod não gera arquivos há 20min.
// Se no_mod_detected=true, desclassifica a entrada ativa do personagem informado.
router.post('/heartbeat', syncLimiter, async (req: Request, res: Response): Promise<void> => {
  const { player_token, character_name, no_mod_detected } = req.body as {
    player_token?:    string;
    character_name?:  string;
    no_mod_detected?: boolean;
  };

  if (!player_token) {
    res.status(400).json({ error: 'player_token é obrigatório.' });
    return;
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, status, blocked')
    .eq('player_token', player_token)
    .maybeSingle();

  if (playerError || !player) { res.status(401).json({ error: 'Token inválido.' }); return; }
  if (player.status !== 'approved') { res.status(403).json({ error: 'Jogador aguardando aprovação.' }); return; }
  if (player.blocked) { res.status(403).json({ error: 'Jogador bloqueado.' }); return; }

  if (!no_mod_detected) {
    res.status(200).json({ success: true });
    return;
  }

  // Mod removido detectado: busca a entrada ativa do personagem e desclassifica
  let query = supabase
    .from(config.tableName)
    .select('id, is_alive, sandbox_ok, updated_at')
    .eq('player_id', player.id)
    .eq('is_alive', true)
    .eq('sandbox_ok', true);

  if (character_name) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).eq('character_name', character_name);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entry } = await (query as any).maybeSingle() as { data: { id: number; updated_at: string | null } | null };

  if (!entry) {
    res.status(200).json({ success: true, note: 'Sem entrada ativa para desclassificar.' });
    return;
  }

  // Falso positivo: se a entrada foi sincronizada há menos de 2h, o mod estava ativo
  // recentemente — o jogador provavelmente ficou passivo (sem kills/dias novos).
  // O Companion dispara após 30min sem arquivo; o mod só gera arquivo com mudança de estado.
  // updated_at nulo = entrada nunca sincronizada (raro) → tratar como recente para evitar
  // desclassificação imediata de entradas novas sem histórico de sync.
  if (!entry.updated_at) {
    res.status(200).json({ success: true, note: 'Entrada sem histórico de sync — heartbeat ignorado.' });
    return;
  }
  const msSinceUpdate = Date.now() - new Date(entry.updated_at).getTime();
  if (msSinceUpdate < 2 * 60 * 60 * 1000) {
    res.status(200).json({ success: true, note: 'Entrada sincronizada recentemente — heartbeat ignorado.' });
    return;
  }

  await supabase
    .from(config.tableName)
    .update({
      sandbox_ok:              false,
      score:                   0,
      disqualification_reason: 'mod_removed',
      disqualified_at:         new Date().toISOString(),
      updated_at:              new Date().toISOString(),
    })
    .eq('id', (entry as { id: number }).id);

  res.status(200).json({ success: true, disqualified: true });
});

// GET /sync/allowed-mods — público, sem auth
// Retorna a lista de mods permitidos (status='active') com mod_id e is_required.
// Usado pelo Companion para gerar o arquivo de whitelist lido pelo mod Lua.
router.get('/allowed-mods', async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('mods')
    .select('mod_id, name, is_required')
    .eq('status', 'active')
    .not('mod_id', 'is', null);

  if (error) {
    res.status(500).json({ error: dbError(error).message });
    return;
  }

  res.json({ mods: data ?? [] });
});

export default router;
import { Router } from 'express';
import type { Response } from 'express';
import { supabase } from '../supabase';
import { dbError, translateSupabaseError } from '../lib/errors';
import { requireModerator } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';
import { notifyModAllowed, notifyModRemoved, notifyModBlocked } from '../lib/discord';
import { computeModStats, type StatsRun, type StatsMod } from '../lib/modStats';
import { config } from '../config';
import { extractWorkshopId, canonicalWorkshopUrl, modIdError } from '../lib/modInput';
import { resolveCategories, cleanCategoryOverride, parseStringList } from '../lib/modCategories';
import { refreshWorkshopItems } from '../lib/steamWorkshop';

const router = Router();

const SELECT_PUBLIC = 'id, name, mod_id, workshop_id, workshop_url, is_required, image_url, block_reason, status, created_at, updated_at';
const SELECT_ALL    = 'id, name, mod_id, workshop_id, workshop_url, is_required, image_url, block_reason, status, created_at, updated_at';

async function fetchSteamModImage(workshopUrl: string): Promise<string | null> {
  try {
    const fileId = extractWorkshopId(workshopUrl);
    if (!fileId) return null;

    const res = await fetch(
      'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    `itemcount=1&publishedfileids[0]=${fileId}`,
      }
    );
    if (!res.ok) return null;

    const json = await res.json() as {
      response?: {
        publishedfiledetails?: Array<{ result?: number; preview_url?: string }>;
      };
    };

    const detail = json.response?.publishedfiledetails?.[0];
    if (!detail || detail.result !== 1 || !detail.preview_url) return null;
    return detail.preview_url;
  } catch {
    return null;
  }
}

type RawMod = Record<string, unknown>;

async function attachDeps(mods: RawMod[]): Promise<RawMod[]> {
  const [{ data: allMods }, { data: deps }] = await Promise.all([
    supabase.from('mods').select('id, name'),
    supabase.from('mod_dependencies').select('mod_id, depends_on_id'),
  ]);

  if (!deps || deps.length === 0) return mods.map(m => ({ ...m, dependencies: [] }));

  const nameMap = new Map<number, string>(
    (allMods ?? []).map((m: RawMod) => [m.id as number, m.name as string])
  );
  const depsMap = new Map<number, Array<{ id: number; name: string }>>();
  for (const dep of deps as Array<{ mod_id: number; depends_on_id: number }>) {
    if (!depsMap.has(dep.mod_id)) depsMap.set(dep.mod_id, []);
    depsMap.get(dep.mod_id)!.push({
      id:   dep.depends_on_id,
      name: nameMap.get(dep.depends_on_id) ?? `Mod #${dep.depends_on_id}`,
    });
  }

  return mods.map(m => ({ ...m, dependencies: depsMap.get(m.id as number) ?? [] }));
}

async function setDependencies(modId: number, depIds: number[]): Promise<void> {
  await supabase.from('mod_dependencies').delete().eq('mod_id', modId);
  if (depIds.length > 0) {
    await supabase
      .from('mod_dependencies')
      .insert(depIds.map(did => ({ mod_id: modId, depends_on_id: did })));
  }
}

// Resolve o login do moderador autenticado para exibir como "Responsável" nas
// notificações do Discord (mesmo padrão usado em entries.ts e players.ts).
async function resolveModeratorLogin(userId: string | undefined): Promise<string> {
  if (!userId) return 'moderador';
  const { data: mod } = await supabase
    .from('moderators')
    .select('login')
    .eq('id', userId)
    .single();
  return mod?.login ?? userId;
}

// Dados da Oficina (workshop_items, cron diário) em cada mod: categorias, inscritos e
// data da última atualização. Mod cujo item ainda não foi buscado fica com categoria
// "outros" e o resto null — a página não depende do cron ter rodado.
async function attachWorkshop(mods: RawMod[]): Promise<RawMod[]> {
  const { data } = await supabase
    .from('workshop_items')
    .select('workshop_id, tags, subscriptions, steam_updated_at, categories');
  const byId = new Map<string, RawMod>(((data ?? []) as RawMod[]).map(w => [String(w.workshop_id), w]));
  return mods.map(m => {
    const w = m.workshop_id ? byId.get(String(m.workshop_id)) : undefined;
    const updated = w?.steam_updated_at;
    return {
      ...m,
      categories:          resolveCategories(w?.tags ?? null, w?.categories ?? null),
      category_override:   w ? cleanCategoryOverride(parseStringList(w.categories)) !== null : false,
      subscriptions:       w?.subscriptions != null ? Number(w.subscriptions) : null,
      steam_updated_at:    updated ? new Date(updated as string).toISOString() : null,
    };
  });
}

// Uso agregado por item na página pública: só o NÚMERO de participantes (run viva e
// válida com sync nos últimos 14 dias), nunca quem são. Mesmo cálculo da aba de
// estatísticas do painel (lib/modStats.ts). Cache de 10 min: varre as runs vivas.
const USAGE_DAYS = 14;
const USAGE_TTL_MS = 10 * 60_000;
let usageCache: { at: number; body: unknown } | null = null;

async function computePublicUsage(): Promise<unknown> {
  const [runsRes, modsRes] = await Promise.all([
    supabase.from(config.tableName)
      .select('player_id, active_mods, updated_at, is_alive, sandbox_ok, character_name')
      .eq('is_alive', true)
      .is('deleted_at', null),
    supabase.from('mods').select('mod_id, name, workshop_id, status, is_required'),
  ]);
  if (runsRes.error || modsRes.error) throw new Error((runsRes.error ?? modsRes.error)!.message);
  const runs = ((runsRes.data ?? []) as StatsRun[]).map(r => ({ ...r, nick: null }));
  const stats = computeModStats(runs, (modsRes.data ?? []) as StatsMod[], USAGE_DAYS);
  return {
    days: USAGE_DAYS,
    participants: stats.participants,
    items: stats.items
      .filter(i => i.status === 'permitido' || i.status === 'misto')
      .map(i => ({ workshop_id: i.workshop_id, mod_ids: i.mod_ids, players: i.players })),
  };
}

async function handleGetMods(req: import('express').Request, res: Response): Promise<void> {
  const status = req.query.status === 'blocked' ? 'blocked' : 'active';
  try {
    const { data, error } = await supabase
      .from('mods')
      .select(SELECT_PUBLIC)
      .eq('status', status)
      .order('name', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(await attachWorkshop(await attachDeps((data ?? []) as RawMod[])));
  } catch (err) {
    console.error('[GET /mods/list] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar mods.' });
  }
}

// GET /mods/list?status=active|blocked — public: lista de mods por status.
router.get('/list', handleGetMods);
// Alias legado mantido para compatibilidade com chamadas diretas.
router.get('/', handleGetMods);

// GET /mods/usage — público: quantos participantes usam cada item permitido (só números).
router.get('/usage', async (_req, res: Response): Promise<void> => {
  try {
    if (!usageCache || Date.now() - usageCache.at > USAGE_TTL_MS) {
      usageCache = { at: Date.now(), body: await computePublicUsage() };
    }
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(usageCache.body);
  } catch (err) {
    console.error('[GET /mods/usage] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao calcular o uso dos mods.' });
  }
});

// PATCH /mods/workshop/:workshopId/categories — moderador: corrige a categoria de um item
// da Oficina. Body { categories: string[] | null }; null ou lista vazia volta para as tags.
router.patch('/workshop/:workshopId/categories', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const wid = String(req.params.workshopId ?? '');
  if (!/^\d{1,20}$/.test(wid)) { res.status(400).json({ error: 'Número do item da Oficina inválido.' }); return; }
  const raw = (req.body as { categories?: unknown })?.categories;
  const categories = raw === null ? null : cleanCategoryOverride(raw);
  if (raw !== null && Array.isArray(raw) && raw.length > 0 && categories === null) {
    res.status(400).json({ error: 'Categoria desconhecida.' }); return;
  }
  const { data: used } = await supabase.from('mods').select('id').eq('workshop_id', wid).limit(1);
  if (!used || (used as unknown[]).length === 0) { res.status(404).json({ error: 'Nenhum mod cadastrado com esse item da Oficina.' }); return; }
  const { error } = await supabase.from('workshop_items')
    .upsert([{ workshop_id: wid, categories: categories ? JSON.stringify(categories) : null }], { onConflict: 'workshop_id' });
  if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
  res.json({ workshop_id: wid, categories });
});

// POST /mods/refresh-workshop — moderador: busca agora na Steam as tags, inscritos e
// datas (o cron faz o mesmo uma vez por dia).
router.post('/refresh-workshop', requireModerator, async (_req: ModRequest, res: Response): Promise<void> => {
  try {
    res.json(await refreshWorkshopItems());
  } catch (err) {
    console.error('[POST /mods/refresh-workshop] falhou:', err);
    res.status(502).json({ error: 'Não foi possível consultar a Steam agora.' });
  }
});

// GET /mods/all — moderator: returns all mods (active + blocked)
// GET /mods/stats?days=14 — moderador: quantos participantes usam cada mod (lib/modStats.ts).
// days = 7 | 14 | 30 ou "all" (todas as runs vivas). Padrão 14.
router.get('/stats', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const raw  = String(req.query['days'] ?? '14');
  const days = raw === 'all' ? null : Math.min(Math.max(parseInt(raw, 10) || 14, 1), 365);
  const [runsRes, modsRes] = await Promise.all([
    supabase.from(config.tableName)
      .select('player_id, name, character_name, active_mods, updated_at, is_alive, sandbox_ok')
      .eq('is_alive', true)
      .is('deleted_at', null),
    supabase.from('mods').select('mod_id, name, workshop_id, status, is_required'),
  ]);
  if (runsRes.error || modsRes.error) {
    res.status(500).json({ error: dbError((runsRes.error ?? modsRes.error)!).message });
    return;
  }
  const runs = ((runsRes.data ?? []) as Array<StatsRun & { name: string | null }>)
    .map(r => ({ ...r, nick: r.name }));
  res.setHeader('Cache-Control', 'no-store');
  res.json(computeModStats(runs, (modsRes.data ?? []) as StatsMod[], days));
});

router.get('/all', requireModerator, async (_req: ModRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('mods')
      .select(SELECT_ALL)
      .order('name', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(await attachWorkshop(await attachDeps((data ?? []) as RawMod[])));
  } catch (err) {
    console.error('[GET /mods/all] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar mods.' });
  }
});

// POST /mods — moderator: add new mod
// status/block_reason são opcionais — permitem cadastrar um mod ja bloqueado
// em uma unica chamada (ver ModManagement.tsx: fluxo de grupo de mods, que
// cria e bloqueia na mesma submissao). Sem eles, mantem o comportamento
// historico de sempre nascer 'active'.
router.post('/', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const { name, mod_id, workshop_url, is_required, dependency_ids, status, block_reason } = req.body as {
    name?: string; mod_id?: string; workshop_url?: string; is_required?: boolean; dependency_ids?: number[];
    status?: 'active' | 'blocked'; block_reason?: string | null;
  };
  const initialStatus = status === 'blocked' ? 'blocked' as const : 'active' as const;

  if (!name?.trim() || !workshop_url?.trim()) {
    res.status(400).json({ error: 'Nome e URL da oficina são obrigatórios.' });
    return;
  }

  const trimmedUrl   = canonicalWorkshopUrl(workshop_url.trim());
  const trimmedModId = mod_id?.trim() || null;

  if (!trimmedUrl.startsWith('https://steamcommunity.com/')) {
    res.status(400).json({ error: 'A URL deve ser da Steam (steamcommunity.com).' });
    return;
  }
  const modIdProblem = modIdError(trimmedModId);
  if (modIdProblem) {
    res.status(400).json({ error: modIdProblem });
    return;
  }

  try {
    // Um mesmo item da Workshop pode empacotar mais de um mod (mod_id diferente,
    // podendo ter status diferente entre si — ex: um permitido e outro bloqueado).
    // Por isso a URL não é mais unique sozinha: só bloqueia duplicata real
    // (mesma URL + mesmo mod_id, incluindo o caso de ambos sem mod_id definido).
    const { data: sameUrlMods } = await supabase
      .from('mods')
      .select('id, mod_id')
      .eq('workshop_url', trimmedUrl);

    const dup = ((sameUrlMods ?? []) as RawMod[]).find(m => (m.mod_id ?? null) === trimmedModId);
    if (dup) {
      res.status(400).json({
        error: trimmedModId
          ? `Já existe um mod cadastrado com este link e o ID "${trimmedModId}".`
          : 'Este mod já está cadastrado (mesma URL, sem ID definido).',
      });
      return;
    }

    const image_url    = await fetchSteamModImage(trimmedUrl);
    const workshop_id  = extractWorkshopId(trimmedUrl);

    const { data, error } = await supabase
      .from('mods')
      .insert([{
        name: name.trim(), mod_id: trimmedModId, workshop_id, workshop_url: trimmedUrl,
        is_required: is_required ?? false, image_url,
        status: initialStatus,
        block_reason: initialStatus === 'blocked' ? (block_reason?.trim() || null) : null,
      }])
      .select(SELECT_ALL)
      .single();

    if (error) {
      const msg = error.code === '23505'
        ? 'Este mod já está cadastrado.'
        : translateSupabaseError(error.message);
      res.status(error.code === '23505' ? 400 : 500).json({ error: msg });
      return;
    }

    const mod = data as RawMod;
    if (Array.isArray(dependency_ids) && dependency_ids.length > 0) {
      await setDependencies(mod.id as number, dependency_ids);
    }

    const moderatorLogin = await resolveModeratorLogin(req.userId);
    if (initialStatus === 'blocked') {
      await notifyModBlocked({
        name:           mod.name as string,
        modId:          (mod.mod_id as string | null) ?? null,
        workshopId:     (mod.workshop_id as string | null) ?? null,
        workshopUrl:    mod.workshop_url as string,
        moderator:      moderatorLogin,
        reason:         (mod.block_reason as string | null) ?? null,
        previousStatus: null,
      });
    } else {
      await notifyModAllowed({
        name:        mod.name as string,
        modId:       (mod.mod_id as string | null) ?? null,
        workshopId:  (mod.workshop_id as string | null) ?? null,
        workshopUrl: mod.workshop_url as string,
        moderator:   moderatorLogin,
      });
    }

    const [withDeps] = await attachDeps([mod]);
    res.status(201).json(withDeps);
  } catch (err) {
    console.error('[POST /mods] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao adicionar mod.' });
  }
});

// PATCH /mods/:id — moderator: update name, url, is_required, dependencies
router.patch('/:id', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { name, mod_id, workshop_url, is_required, dependency_ids } = req.body as {
    name?: string; mod_id?: string; workshop_url?: string; is_required?: boolean; dependency_ids?: number[];
  };

  if (!name?.trim() || !workshop_url?.trim()) {
    res.status(400).json({ error: 'Nome e URL da oficina são obrigatórios.' });
    return;
  }

  const trimmedUrl   = canonicalWorkshopUrl(workshop_url.trim());
  const trimmedModId = mod_id?.trim() || null;

  if (!trimmedUrl.startsWith('https://steamcommunity.com/')) {
    res.status(400).json({ error: 'A URL deve ser da Steam (steamcommunity.com).' });
    return;
  }
  const modIdProblem = modIdError(trimmedModId);
  if (modIdProblem) {
    res.status(400).json({ error: modIdProblem });
    return;
  }

  try {
    // Ver comentário equivalente no POST: mesma URL pode ter mais de um mod_id
    // cadastrado (mesmo item da Workshop empacotando mods distintos).
    const { data: sameUrlMods } = await supabase
      .from('mods')
      .select('id, mod_id')
      .eq('workshop_url', trimmedUrl);

    const dup = ((sameUrlMods ?? []) as RawMod[]).find(
      m => (m.id as number) !== id && (m.mod_id ?? null) === trimmedModId
    );
    if (dup) {
      res.status(400).json({
        error: trimmedModId
          ? `Já existe outro mod cadastrado com este link e o ID "${trimmedModId}".`
          : 'Já existe outro mod cadastrado com esta URL sem ID definido.',
      });
      return;
    }

    const image_url    = await fetchSteamModImage(trimmedUrl);
    const workshop_id  = extractWorkshopId(trimmedUrl);

    const { data, error } = await supabase
      .from('mods')
      .update({
        name: name.trim(),
        mod_id: trimmedModId,
        workshop_id,
        workshop_url: trimmedUrl,
        is_required: is_required ?? false,
        image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(SELECT_ALL)
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    if (!data) { res.status(404).json({ error: 'Mod não encontrado.' }); return; }

    if (Array.isArray(dependency_ids)) {
      await setDependencies(id, dependency_ids);
    }

    const [withDeps] = await attachDeps([data as RawMod]);
    res.json(withDeps);
  } catch (err) {
    console.error('[PATCH /mods/:id] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar mod.' });
  }
});

// POST /mods/refresh-images — moderator: re-fetch Steam images for mods without image_url
router.post('/refresh-images', requireModerator, async (_req: ModRequest, res: Response): Promise<void> => {
  try {
    const { data: mods, error } = await supabase
      .from('mods')
      .select('id, workshop_url, image_url')
      .is('image_url', null);

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }

    const targets = (mods ?? []) as Array<{ id: number; workshop_url: string; image_url: string | null }>;
    let updated = 0;

    await Promise.all(targets.map(async mod => {
      const image_url = await fetchSteamModImage(mod.workshop_url);
      if (!image_url) return;
      await supabase.from('mods').update({ image_url }).eq('id', mod.id);
      updated++;
    }));

    res.json({ total: targets.length, updated });
  } catch (err) {
    console.error('[POST /mods/refresh-images] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar imagens.' });
  }
});

// PATCH /mods/:id/block — moderator. Aceita { reason? } — motivo exibido aos
// players na pagina publica de mods, para que saibam por que esta bloqueado.
router.patch('/:id/block', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { reason } = req.body as { reason?: string };
  try {
    // Lido antes do update para saber o status anterior: decide se a
    // notificação deve dizer "estava permitido" ou "não estava listado",
    // e evita reenviar o aviso se o mod já estava bloqueado (no-op).
    const { data: existing } = await supabase
      .from('mods')
      .select('status')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('mods')
      .update({ status: 'blocked', block_reason: reason?.trim() || null })
      .eq('id', id)
      .select(SELECT_ALL)
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    if (!data) { res.status(404).json({ error: 'Mod não encontrado.' }); return; }

    if (existing?.status !== 'blocked') {
      const mod = data as RawMod;
      const moderatorLogin = await resolveModeratorLogin(req.userId);
      await notifyModBlocked({
        name:           mod.name as string,
        modId:          (mod.mod_id as string | null) ?? null,
        workshopId:     (mod.workshop_id as string | null) ?? null,
        workshopUrl:    mod.workshop_url as string,
        moderator:      moderatorLogin,
        reason:         (mod.block_reason as string | null) ?? null,
        previousStatus: existing?.status === 'active' ? 'active' : null,
      });
    }

    const [withDeps] = await attachDeps([data as RawMod]);
    res.json(withDeps);
  } catch (err) {
    console.error('[PATCH /mods/:id/block] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao bloquear mod.' });
  }
});

// PATCH /mods/:id/unblock — moderator: limpa o motivo de bloqueio junto com o status.
router.patch('/:id/unblock', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  try {
    const { data: existing } = await supabase
      .from('mods')
      .select('status')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('mods')
      .update({ status: 'active', block_reason: null })
      .eq('id', id)
      .select(SELECT_ALL)
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    if (!data) { res.status(404).json({ error: 'Mod não encontrado.' }); return; }

    if (existing?.status === 'blocked') {
      const mod = data as RawMod;
      const moderatorLogin = await resolveModeratorLogin(req.userId);
      await notifyModAllowed({
        name:        mod.name as string,
        modId:       (mod.mod_id as string | null) ?? null,
        workshopId:  (mod.workshop_id as string | null) ?? null,
        workshopUrl: mod.workshop_url as string,
        moderator:   moderatorLogin,
      });
    }

    const [withDeps] = await attachDeps([data as RawMod]);
    res.json(withDeps);
  } catch (err) {
    console.error('[PATCH /mods/:id/unblock] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao desbloquear mod.' });
  }
});

// DELETE /mods/:id — moderator: remove permanently
router.delete('/:id', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  try {
    // Lido antes do delete: é a única chance de saber se o mod estava
    // permitido (única transição que gera o aviso de "removido da lista de
    // permitidos" — um mod que já estava bloqueado sendo apagado não é essa
    // transição, então não notifica).
    const { data: existing } = await supabase
      .from('mods')
      .select('status, name, mod_id, workshop_id, workshop_url')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('mods').delete().eq('id', id);
    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }

    if (existing?.status === 'active') {
      const moderatorLogin = await resolveModeratorLogin(req.userId);
      await notifyModRemoved({
        name:        existing.name as string,
        modId:       (existing.mod_id as string | null) ?? null,
        workshopId:  (existing.workshop_id as string | null) ?? null,
        workshopUrl: existing.workshop_url as string,
        moderator:   moderatorLogin,
      });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /mods/:id] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao remover mod.' });
  }
});

export default router;

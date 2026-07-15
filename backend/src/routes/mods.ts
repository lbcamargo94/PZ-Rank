import { Router } from 'express';
import type { Response } from 'express';
import { supabase } from '../supabase';
import { dbError, translateSupabaseError } from '../lib/errors';
import { requireModerator } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';

const router = Router();

const SELECT_PUBLIC = 'id, name, workshop_url, is_required, image_url, created_at, updated_at';
const SELECT_ALL    = 'id, name, workshop_url, is_required, image_url, status, created_at, updated_at';

async function fetchSteamModImage(workshopUrl: string): Promise<string | null> {
  try {
    const match = workshopUrl.match(/[?&]id=(\d+)/);
    if (!match) return null;
    const fileId = match[1];

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

// GET /mods — public: returns only active mods
router.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('mods')
      .select(SELECT_PUBLIC)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(await attachDeps((data ?? []) as RawMod[]));
  } catch (err) {
    console.error('[GET /mods] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar mods.' });
  }
});

// GET /mods/all — moderator: returns all mods (active + blocked)
router.get('/all', requireModerator, async (_req: ModRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('mods')
      .select(SELECT_ALL)
      .order('name', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(await attachDeps((data ?? []) as RawMod[]));
  } catch (err) {
    console.error('[GET /mods/all] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao buscar mods.' });
  }
});

// POST /mods — moderator: add new mod
router.post('/', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const { name, workshop_url, is_required, dependency_ids } = req.body as {
    name?: string; workshop_url?: string; is_required?: boolean; dependency_ids?: number[];
  };

  if (!name?.trim() || !workshop_url?.trim()) {
    res.status(400).json({ error: 'Nome e URL da oficina são obrigatórios.' });
    return;
  }

  const trimmedUrl = workshop_url.trim();
  if (!trimmedUrl.startsWith('https://steamcommunity.com/')) {
    res.status(400).json({ error: 'A URL deve ser da Steam (steamcommunity.com).' });
    return;
  }

  try {
    const { data: existing } = await supabase
      .from('mods')
      .select('id')
      .eq('workshop_url', trimmedUrl)
      .maybeSingle();

    if (existing) {
      res.status(400).json({ error: 'Este mod já está cadastrado (URL da oficina duplicada).' });
      return;
    }

    const image_url = await fetchSteamModImage(trimmedUrl);

    const { data, error } = await supabase
      .from('mods')
      .insert([{ name: name.trim(), workshop_url: trimmedUrl, is_required: is_required ?? false, image_url }])
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
  const { name, workshop_url, is_required, dependency_ids } = req.body as {
    name?: string; workshop_url?: string; is_required?: boolean; dependency_ids?: number[];
  };

  if (!name?.trim() || !workshop_url?.trim()) {
    res.status(400).json({ error: 'Nome e URL da oficina são obrigatórios.' });
    return;
  }

  const trimmedUrl = workshop_url.trim();
  if (!trimmedUrl.startsWith('https://steamcommunity.com/')) {
    res.status(400).json({ error: 'A URL deve ser da Steam (steamcommunity.com).' });
    return;
  }

  try {
    const { data: existing } = await supabase
      .from('mods')
      .select('id')
      .eq('workshop_url', trimmedUrl)
      .maybeSingle();

    if (existing && (existing as RawMod).id !== id) {
      res.status(400).json({ error: 'Este link da oficina já está cadastrado em outro mod.' });
      return;
    }

    const image_url = await fetchSteamModImage(trimmedUrl);

    const { data, error } = await supabase
      .from('mods')
      .update({
        name: name.trim(),
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

// PATCH /mods/:id/block — moderator
router.patch('/:id/block', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  try {
    const { data, error } = await supabase
      .from('mods')
      .update({ status: 'blocked' })
      .eq('id', id)
      .select(SELECT_ALL)
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    if (!data) { res.status(404).json({ error: 'Mod não encontrado.' }); return; }
    const [withDeps] = await attachDeps([data as RawMod]);
    res.json(withDeps);
  } catch (err) {
    console.error('[PATCH /mods/:id/block] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao bloquear mod.' });
  }
});

// PATCH /mods/:id/unblock — moderator
router.patch('/:id/unblock', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  try {
    const { data, error } = await supabase
      .from('mods')
      .update({ status: 'active' })
      .eq('id', id)
      .select(SELECT_ALL)
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    if (!data) { res.status(404).json({ error: 'Mod não encontrado.' }); return; }
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
    const { error } = await supabase.from('mods').delete().eq('id', id);
    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /mods/:id] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno ao remover mod.' });
  }
});

export default router;

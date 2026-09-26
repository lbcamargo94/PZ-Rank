import { Router } from 'express';
import type { Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requireMaster, requireModerator } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';
import {
  BAN_KINDS, describeBan, matchBan, normalizeBanValue,
  type BanEntry, type BanKind, type PlayerIdentity,
} from '../lib/bannedIdentities';

// Lista de identidades banidas (lib/bannedIdentities.ts, migration_v40).
// Moderador lista e adiciona; só master remove (mesma regra da exclusão definitiva).
const router = Router();

// GET /banned-identities — moderador
router.get('/', requireModerator, async (_req: ModRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('banned_identities')
    .select('id, kind, value, reason, created_by, created_at')
    .order('created_at', { ascending: false });
  if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
  res.json(data ?? []);
});

// POST /banned-identities — moderador. body: { kind, value, reason }
// Também marca (ban_match) contas JÁ cadastradas que batem e as devolve em
// `existing_matches` — o moderador decide se bloqueia (não muda status sozinho).
router.post('/', requireModerator, async (req: ModRequest, res: Response): Promise<void> => {
  const { kind, value, reason } = req.body as { kind?: string; value?: string; reason?: string };
  if (!kind || !(BAN_KINDS as readonly string[]).includes(kind)) {
    res.status(400).json({ error: `Tipo inválido. Use: ${BAN_KINDS.join(', ')}.` }); return;
  }
  if (!reason?.trim() || reason.trim().length < 5) {
    res.status(400).json({ error: 'Informe o motivo (mínimo 5 caracteres).' }); return;
  }
  const normalized = normalizeBanValue(kind as BanKind, String(value ?? '').slice(0, 300));
  if (!normalized) {
    res.status(400).json({ error: kind === 'nick' ? 'Nick inválido.' : `Link ou usuário de ${kind} inválido.` }); return;
  }

  const { data: mod } = await supabase.from('moderators').select('login').eq('id', req.userId!).maybeSingle();
  const { data, error } = await supabase
    .from('banned_identities')
    .insert([{
      kind, value: normalized, reason: reason.trim().slice(0, 500),
      created_by: (mod as { login: string } | null)?.login ?? req.userId ?? 'moderador',
    }])
    .select('id, kind, value, reason, created_by, created_at')
    .single();
  if (error) {
    const e = dbError(error);
    res.status(e.httpStatus).json({ error: error.code === '23505' ? 'Este nick/canal já está na lista.' : e.message });
    return;
  }

  // Contas já existentes que batem com a nova entrada
  const ban = data as BanEntry;
  const { data: players } = await supabase
    .from('players')
    .select('id, nick, status, blocked, twitch_url, youtube_url, kick_url, tiktok_url')
    .is('deleted_at', null);
  type P = PlayerIdentity & { id: number; nick: string; status: string; blocked: boolean };
  const hits = ((players ?? []) as P[]).filter(p => matchBan(p, [ban]));
  for (const p of hits) {
    await supabase.from('players').update({ ban_match: describeBan(ban) }).eq('id', p.id);
  }

  res.status(201).json({
    entry: data,
    existing_matches: hits.map(p => ({ id: p.id, nick: p.nick, status: p.status, blocked: p.blocked })),
  });
});

// DELETE /banned-identities/:id — master
router.delete('/:id', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }
  const { error } = await supabase.from('banned_identities').delete().eq('id', id);
  if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
  res.json({ ok: true });
});

export default router;

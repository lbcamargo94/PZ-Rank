import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabase';
import { config } from '../config';
import type { ModRequest } from '../middleware/moderator';
import { parseTarget } from './moderationLog';

// Bloqueio de moderação em causa própria (v4.30.6).
//
// Caso Bone (18–22/10/2026): o moderador "bone" editou os objetivos da própria run (+5.000 pts)
// e limpou 4 vezes a anomalia dela. Nada impedia — o painel mostra todas as runs a todos os
// moderadores. Agora o servidor recusa QUALQUER ação de moderador (POST/PATCH/PUT/DELETE em
// /entries e /players) cujo alvo é o jogador com o mesmo nome do login do moderador; outro
// moderador faz a ação. Vale para o master também. Moderador e jogador não têm vínculo no banco:
// a ligação é o nome (login do moderador = nick do jogador, sem diferenciar maiúsculas).

type Base = 'entries' | 'players';

export function sameIdentity(moderatorLogin: string | null | undefined, playerNick: string | null | undefined): boolean {
  const a = (moderatorLogin ?? '').trim().toLowerCase();
  const b = (playerNick ?? '').trim().toLowerCase();
  return a !== '' && a === b;
}

async function targetPlayerId(base: Base, id: number | null, body: Record<string, unknown> | null): Promise<number | null> {
  if (id == null) {
    // POST /entries (criar run) informa o jogador no corpo
    const pid = body?.['player_id'];
    return base === 'entries' && pid != null && /^\d+$/.test(String(pid)) ? Number(pid) : null;
  }
  if (base === 'players') return id;
  const { data } = await supabase.from(config.tableName).select('player_id').eq('id', id).maybeSingle();
  const pid = (data as { player_id?: number | string | null } | null)?.player_id;
  return pid != null ? Number(pid) : null;
}

export function forbidSelfModeration(base: Base) {
  return async (req: ModRequest, res: Response, next: NextFunction): Promise<void> => {
    const method = req.method.toUpperCase();
    const auth = req.headers.authorization;
    if (method === 'GET' || method === 'OPTIONS' || !auth?.startsWith('Bearer ')) { next(); return; }

    let modId: string;
    try {
      const payload = jwt.verify(auth.slice(7), config.jwtSecret) as { sub?: string };
      if (!payload?.sub) { next(); return; }
      modId = String(payload.sub);
    } catch {
      next(); return;   // token inválido: o requireModerator da rota responde 401
    }

    try {
      const body = (req.body && typeof req.body === 'object') ? req.body as Record<string, unknown> : null;
      const playerId = await targetPlayerId(base, parseTarget(req.path).id, body);
      if (playerId == null) { next(); return; }
      const [{ data: mod }, { data: player }] = await Promise.all([
        supabase.from('moderators').select('login').eq('id', modId).maybeSingle(),
        supabase.from('players').select('nick').eq('id', playerId).maybeSingle(),
      ]);
      const login = (mod as { login?: string } | null)?.login;
      const nick  = (player as { nick?: string } | null)?.nick;
      if (sameIdentity(login, nick)) {
        console.log(`[moderacao] acao na propria conta recusada | moderador=${login} | ${method} /${base}${req.path}`);
        res.status(403).json({ error: 'Moderador não pode moderar a própria conta ou run. Peça para outro moderador fazer esta ação.' });
        return;
      }
    } catch (err) {
      console.error('[moderacao] falha ao checar moderação em causa própria:', err);
    }
    next();
  };
}

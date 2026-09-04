import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabase';
import { config } from '../config';

export interface PlayerRequest extends Request {
  playerId?: number;
  playerNick?: string;
}

interface PlayerJwtPayload {
  sub:  string;
  type: string;
  nick: string;
}

function extractToken(req: Request): string | null {
  // Cookie HttpOnly tem prioridade (mais seguro que header)
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.player_session;
  if (cookieToken) return cookieToken;

  // Fallback: Authorization: Bearer <token> (Companion + clientes legados)
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }

  return null;
}

export async function requirePlayer(req: PlayerRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Token de jogador obrigatório.' });
    return;
  }

  let payload: PlayerJwtPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret) as PlayerJwtPayload;
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
    return;
  }

  if (payload.type !== 'player') {
    res.status(401).json({ error: 'Token inválido.' });
    return;
  }

  const playerId = parseInt(payload.sub, 10);

  const { data: player } = await supabase
    .from('players')
    .select('id, blocked, deleted_at')
    .eq('id', playerId)
    .maybeSingle();

  const row = player as { id: number; blocked: boolean; deleted_at: string | null } | null;

  if (!row || row.deleted_at) { res.status(403).json({ error: 'Conta removida do ranking.' }); return; }
  if (row.blocked)             { res.status(403).json({ error: 'Conta bloqueada. Contate um moderador.' }); return; }

  req.playerId   = playerId;
  req.playerNick = payload.nick;
  next();
}

import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase';

export interface PlayerRequest extends Request {
  playerId?: number;
  playerNick?: string;
}

export async function requirePlayer(req: PlayerRequest, res: Response, next: NextFunction): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de jogador obrigatório.' });
    return;
  }
  const token = auth.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Token de jogador obrigatório.' });
    return;
  }

  const { data: player, error } = await supabase
    .from('players')
    .select('id, nick, deleted_at, blocked')
    .eq('player_token', token)
    .maybeSingle();

  if (error || !player) {
    res.status(401).json({ error: 'Token inválido.' });
    return;
  }

  const row = player as { id: number; nick: string; deleted_at: string | null; blocked: boolean };

  if (row.deleted_at) { res.status(403).json({ error: 'Conta removida do ranking.' }); return; }
  if (row.blocked)    { res.status(403).json({ error: 'Conta bloqueada. Contate um moderador.' }); return; }

  req.playerId   = row.id;
  req.playerNick = row.nick;
  next();
}

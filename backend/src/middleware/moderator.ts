import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { ModeratorRole } from '../types';

export interface ModRequest extends Request {
  userId?:  string;
  modRole?: ModeratorRole;
}

interface JwtPayload {
  sub:  string;
  role: ModeratorRole;
}

function authenticate(req: ModRequest, res: Response): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido.' });
    return false;
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), config.jwtSecret) as JwtPayload;
    req.userId  = payload.sub;
    req.modRole = payload.role;
    return true;
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
    return false;
  }
}

export function requireModerator(
  req: ModRequest, res: Response, next: NextFunction
): void {
  if (!authenticate(req, res)) return;
  next();
}

export function requireMaster(
  req: ModRequest, res: Response, next: NextFunction
): void {
  if (!authenticate(req, res)) return;
  if (req.modRole !== 'master') {
    res.status(403).json({ error: 'Acesso restrito ao moderador master.' });
    return;
  }
  next();
}

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRouter        from './routes/auth';
import authPlayerRouter  from './routes/auth-player';
import entriesRouter     from './routes/entries';
import playersRouter     from './routes/players';
import moderatorsRouter  from './routes/moderators';
import modsRouter        from './routes/mods';
import syncRouter        from './routes/sync';
import accountRouter     from './routes/account';

// Rate limiters por contexto de uso
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutos
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
});

const sensitiveActionLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Muitas solicitações. Aguarde 15 minutos.' },
});

const syncLimiter = rateLimit({
  windowMs:        60 * 1000, // 1 minuto
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Muitas sincronizações. Aguarde um momento.' },
});

export function createApp() {
  const app = express();

  // Vercel senta atrás de um proxy — sem isso req.ip fica sendo o IP interno
  // do proxy e todos os jogadores compartilham o mesmo contador de rate limit.
  app.set('trust proxy', 1);

  app.use(helmet());

  // O Helmet seta Cache-Control: public, max-age=0, must-revalidate por padrão.
  // O "public" permite conditional caching (304) no CDN e no browser.
  // Quando o domínio mudou de pzrank.com.br para www.pzrank.com.br, respostas
  // cacheadas com Access-Control-Allow-Origin: https://pzrank.com.br continuaram
  // sendo servidas (incluindo 304s) para requisições de https://www.pzrank.com.br.
  // Uma API nunca deve ser cacheada — no-store impede qualquer cache.
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const allowedOrigins = config.corsOrigin.split(',').map(o => o.trim());
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
  }));

  // Bloqueia requisições de origens não autorizadas antes de processar o body
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin) && !/^http:\/\/localhost:\d+$/.test(origin)) {
      res.status(403).json({ error: 'Origem não autorizada.' });
      return;
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  // Rate limiting em endpoints de autenticação
  app.use('/auth/login',                          authLimiter);
  app.use('/auth/player/login',                   authLimiter);
  app.use('/auth/player/forgot-password',         sensitiveActionLimiter);
  app.use('/auth/player/resend-verification',     sensitiveActionLimiter);
  app.use('/auth/player/activate',                authLimiter);
  app.use('/auth/player/reset-password',          authLimiter);
  app.use('/players/register',                    sensitiveActionLimiter);
  app.use('/auth/player/claim',                   sensitiveActionLimiter);
  app.use('/account/me/password',                 authLimiter);
  app.use('/account/me/email',                    sensitiveActionLimiter);
  app.use('/account/me/otp',                      sensitiveActionLimiter);
  app.use('/auth/player/otp',                     authLimiter);
  app.use('/sync',                                syncLimiter);

  app.use('/auth',        authRouter);
  app.use('/auth/player', authPlayerRouter);
  app.use('/entries',     entriesRouter);
  app.use('/players',    playersRouter);
  app.use('/moderators', moderatorsRouter);
  app.use('/mods',       modsRouter);
  app.use('/sync',       syncRouter);
  app.use('/account',    accountRouter);

  return app;
}

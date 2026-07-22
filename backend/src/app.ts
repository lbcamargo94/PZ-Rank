import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import authRouter       from './routes/auth';
import entriesRouter    from './routes/entries';
import playersRouter    from './routes/players';
import moderatorsRouter from './routes/moderators';
import modsRouter       from './routes/mods';
import syncRouter       from './routes/sync';

export function createApp() {
  const app = express();

  // Vercel senta atrás de um proxy — sem isso req.ip fica sendo o IP interno
  // do proxy e todos os jogadores compartilham o mesmo contador de rate limit.
  app.set('trust proxy', 1);

  app.use(helmet());
  const allowedOrigins = config.corsOrigin.split(',').map(o => o.trim());
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS bloqueado para a origem: ${origin}`));
      }
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use('/auth',       authRouter);
  app.use('/entries',    entriesRouter);
  app.use('/players',    playersRouter);
  app.use('/moderators', moderatorsRouter);
  app.use('/mods',       modsRouter);
  app.use('/sync',       syncRouter);

  return app;
}

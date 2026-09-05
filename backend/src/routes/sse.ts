/**
 * GET /sse — endpoint Server-Sent Events.
 *
 * Mantém a conexão aberta e empurra eventos nomeados para o cliente:
 *   - live-status   → alguém foi ao vivo ou encerrou (emitido pelo cron/scan-lives)
 *   - rank-updated  → um sync processou nova pontuação
 *   - player-died   → is_alive mudou de true → false num sync
 *
 * Eventos têm `id:` sequencial; ao reconectar o browser envia Last-Event-ID
 * e o servidor reenvia automaticamente os eventos perdidos (buffer de 120).
 *
 * Heartbeat a cada 25s: mantém vivo dentro do proxy_read_timeout 3600s do Nginx.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { addSseClient, removeSseClient } from '../lib/sse';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const lastIdHeader = req.headers['last-event-id'];
  const lastEventId  = lastIdHeader ? parseInt(lastIdHeader as string, 10) : undefined;

  const clientId = addSseClient(res, lastEventId);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { /* cliente desconectou */ }
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeSseClient(clientId);
  });
});

export default router;

/**
 * sse.ts — Gerenciador de clientes Server-Sent Events.
 *
 * Singleton em memória: funciona enquanto o PM2 rodar em fork mode (1 processo).
 * Se escalar para cluster/múltiplas instâncias, trocar pelo Redis pub/sub.
 */

import type { Response } from 'express';

interface SseClient {
  id:  number;
  res: Response;
}

let nextId = 1;
const clients = new Map<number, SseClient>();

export function addSseClient(res: Response): number {
  const id = nextId++;
  clients.set(id, { id, res });
  return id;
}

export function removeSseClient(id: number): void {
  clients.delete(id);
}

export function sseClientCount(): number {
  return clients.size;
}

/** Envia um evento nomeado para todos os clientes conectados. */
export function broadcast(event: string, data: unknown): void {
  if (clients.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client.id);
    }
  }
}

/**
 * sse.ts — Gerenciador de clientes Server-Sent Events.
 *
 * Singleton em memória: funciona enquanto o PM2 rodar em fork mode (1 processo).
 * Se escalar para cluster/múltiplas instâncias, trocar pelo Redis pub/sub.
 *
 * Garantias implementadas:
 *  - Cada evento tem um `id:` sequencial global
 *  - Buffer circular dos últimos BUFFER_SIZE eventos
 *  - Na reconexão, o browser envia Last-Event-ID e o servidor reenvio os perdidos
 */

import type { Response } from 'express';

const BUFFER_SIZE = 120;

interface SseClient {
  id:  number;
  res: Response;
}

interface BufferedEvent {
  id:    number;
  event: string;
  data:  string;
}

let nextClientId  = 1;
let nextEventId   = 1;

const clients = new Map<number, SseClient>();
const buffer: BufferedEvent[] = [];

function pushBuffer(ev: BufferedEvent): void {
  buffer.push(ev);
  if (buffer.length > BUFFER_SIZE) buffer.shift();
}

/** Registra um novo cliente SSE e reenvia eventos perdidos desde lastEventId. */
export function addSseClient(res: Response, lastEventId?: number): number {
  const id = nextClientId++;
  clients.set(id, { id, res });

  if (lastEventId !== undefined && lastEventId > 0) {
    const missed = buffer.filter(e => e.id > lastEventId);
    for (const ev of missed) {
      try {
        res.write(`id: ${ev.id}\nevent: ${ev.event}\ndata: ${ev.data}\n\n`);
      } catch {
        clients.delete(id);
        return id;
      }
    }
  }

  return id;
}

export function removeSseClient(id: number): void {
  clients.delete(id);
}

export function sseClientCount(): number {
  return clients.size;
}

/** Envia um evento nomeado para todos os clientes conectados e salva no buffer. */
export function broadcast(event: string, data: unknown): void {
  const id      = nextEventId++;
  const dataStr = JSON.stringify(data);
  const payload = `id: ${id}\nevent: ${event}\ndata: ${dataStr}\n\n`;

  pushBuffer({ id, event, data: dataStr });

  for (const client of clients.values()) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client.id);
    }
  }
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkLivesBatch, YT_BATCH_MAX_IDS } from '../lib/youtube';
import { endCheckBudgetLeft, LIVE_END_CHECK_MAX_CALLS_PER_DAY } from '../lib/liveScan';

const item = (id: string, content: string, ended = false) => ({
  id, snippet: { liveBroadcastContent: content },
  liveStreamingDetails: { actualStartTime: '2026-10-10T10:00:00Z', ...(ended ? { actualEndTime: '2026-10-10T12:00:00Z' } : {}) },
});

describe('consulta de lives do YouTube em lote (v4.29.8)', () => {
  beforeEach(() => { process.env.YOUTUBE_API_KEY = 'teste'; });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('uma chamada para várias lives: ao vivo, encerrada e apagada', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ items: [item('a', 'live'), item('b', 'none', true)] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await checkLivesBatch(['a', 'b', 'c']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(r.calls).toBe(1);
    expect(r.status.get('a')).toBe(true);
    expect(r.status.get('b')).toBe(false);
    expect(r.status.get('c')).toBe(false);   // não voltou numa chamada OK = apagado/privado
    expect(r.failed.size).toBe(0);
  });

  it('falha da API é inconclusiva: nenhuma live é dada como encerrada', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('erro', { status: 500 })));
    const r = await checkLivesBatch(['a', 'b']);
    expect(r.status.size).toBe(0);
    expect([...r.failed].sort()).toEqual(['a', 'b']);
  });

  it('mais de 50 lives: uma chamada por grupo de 50', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const ids = Array.from({ length: YT_BATCH_MAX_IDS + 10 }, (_, i) => `v${i}`);
    const r = await checkLivesBatch(ids);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(r.calls).toBe(2);
  });

  it('teto diário do job começa cheio a cada dia', () => {
    expect(endCheckBudgetLeft(new Date('2026-10-11T00:00:01Z'))).toBe(LIVE_END_CHECK_MAX_CALLS_PER_DAY);
  });
});

import { describe, it, expect } from 'vitest';
import { selectHeatPoints } from '../lib/heatmap';

const kill  = { type: 'kill',  gx: 100, gy: 90, count: 3 };
const base  = { type: 'base',  gx: 101, gy: 90, count: 1 };
const death = { type: 'death', gx: 102, gy: 91, count: 1 };

describe('selectHeatPoints', () => {
  it('lote novo: entra tudo; morte só no sync da morte', () => {
    const d = [{ type: 'batch', id: 'a1' }, kill, base, death];
    expect(selectHeatPoints(d, { diedNow: false, lastBatch: null })).toEqual({ points: [kill, base], batchId: 'a1' });
    expect(selectHeatPoints(d, { diedNow: true,  lastBatch: null }).points).toEqual([kill, base, death]);
  });

  it('mesmo lote reenviado pelo Companion é ignorado', () => {
    const d = [{ type: 'batch', id: 'a1' }, kill, base];
    expect(selectHeatPoints(d, { diedNow: false, lastBatch: 'a1' })).toEqual({ points: [], batchId: 'a1' });
  });

  it('mod antigo (contagens acumuladas, sem lote): só a morte, no sync da morte', () => {
    expect(selectHeatPoints([kill, base, death], { diedNow: false, lastBatch: null })).toEqual({ points: [], batchId: null });
    expect(selectHeatPoints([kill, base, death], { diedNow: true,  lastBatch: null }).points).toEqual([death]);
  });

  it('entrada inválida', () => {
    expect(selectHeatPoints(null, { diedNow: true, lastBatch: null })).toEqual({ points: [], batchId: null });
    expect(selectHeatPoints([{ type: 'batch', id: 5 }, kill], { diedNow: false, lastBatch: null }).points).toEqual([]);
  });
});

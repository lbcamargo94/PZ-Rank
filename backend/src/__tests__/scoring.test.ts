import { describe, it, expect } from 'vitest';
import { computeScore } from '../lib/scoring';

describe('computeScore', () => {
  it('Base Militar vale 1.000 pontos', () => {
    const without = computeScore(1000, 10, { military_base: false });
    const withBase = computeScore(1000, 10, { military_base: true });
    expect(withBase - without).toBe(1000);
  });
});

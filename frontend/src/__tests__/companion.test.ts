import { describe, it, expect } from 'vitest';
import { COMPANION_VERSION, isCompanionOutdated } from '../lib/companion';

describe('isCompanionOutdated', () => {
  const [maj, min, pat] = COMPANION_VERSION.split('.').map(Number) as [number, number, number];

  it('versão desconhecida (Companion antigo, sem cabeçalho) conta como desatualizada', () => {
    expect(isCompanionOutdated(null)).toBe(true);
    expect(isCompanionOutdated(undefined)).toBe(true);
    expect(isCompanionOutdated('')).toBe(true);
  });
  it('compara número a número, não como texto', () => {
    expect(isCompanionOutdated(COMPANION_VERSION)).toBe(false);
    expect(isCompanionOutdated(`${maj}.${min}.${pat + 1}`)).toBe(false);
    expect(isCompanionOutdated(`${maj + 1}.0.0`)).toBe(false);
    expect(isCompanionOutdated(`${maj}.${min + 10}.0`)).toBe(false);
    if (min > 0) expect(isCompanionOutdated(`${maj}.${min - 1}.99`)).toBe(true);
    expect(isCompanionOutdated(`${maj - 1}.99.99`)).toBe(true);
  });
});

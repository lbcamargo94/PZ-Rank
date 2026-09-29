import { describe, it, expect } from 'vitest';
import { isImplausibleTotal, isImplausibleJump, implausibleFlag } from '../lib/plausibility';

describe('trava de plausibilidade dos abates', () => {
  it('caso Anastacia Glubby (400.000 abates em 56 h) é barrado', () => {
    expect(isImplausibleTotal(400000, 3368)).toBe(true);
  });
  it('maiores runs reais de produção passam com folga', () => {
    expect(isImplausibleTotal(138238, 634819)).toBe(false); // Lucille Rankataia, 13/h
    expect(isImplausibleTotal(90000, 424552)).toBe(false);
  });
  it('começo de run com horda grande passa (folga fixa)', () => {
    expect(isImplausibleTotal(250, 30)).toBe(false);
    expect(isImplausibleTotal(350, 60)).toBe(false);
  });
  it('salto entre syncs impossível para o tempo jogado é barrado', () => {
    expect(isImplausibleJump({ kills: 1000, time_raw: 10000 }, 50000, 10060)).toBe(true);
    expect(isImplausibleJump({ kills: 1000, time_raw: 10000 }, 1300, 10060)).toBe(false);
  });
  it('run nova (tempo regrediu) não compara salto', () => {
    expect(isImplausibleJump({ kills: 50000, time_raw: 90000 }, 10, 60)).toBe(false);
  });
  it('anomalia registra abates e tempo', () => {
    expect(implausibleFlag(400000, 3368)).toBe('implausible_kills:400000@3368');
  });
});

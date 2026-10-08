import { describe, it, expect } from 'vitest';
import { classifySyncOutcome, SYNC_HISTORY_RETENTION_DAYS } from '../lib/syncHistory';

describe('classifySyncOutcome', () => {
  it('sync gravado normalmente = aceito', () => {
    expect(classifySyncOutcome(200, { success: true, score: 1200 })).toEqual({ result: 'aceito', detail: null });
  });
  it('desclassificado (nome bloqueado, sandbox, debug)', () => {
    expect(classifySyncOutcome(200, { success: true, disqualified: true, message: 'Personagem desclassificado.' }))
      .toEqual({ result: 'desclassificado', detail: 'Personagem desclassificado.' });
    expect(classifySyncOutcome(200, { disqualified: true, disqualified_reason: 'debug' }).detail).toBe('debug');
  });
  it('recusado pelas travas (200 + stale) ou por erro 4xx', () => {
    expect(classifySyncOutcome(200, { success: true, stale: true }).result).toBe('recusado');
    expect(classifySyncOutcome(400, { error: 'Dados do personagem fora do possível.' }))
      .toEqual({ result: 'recusado', detail: 'Dados do personagem fora do possível.' });
  });
  it('mod desatualizado (426)', () => {
    expect(classifySyncOutcome(426, { error: 'Mod desatualizado' }).result).toBe('mod_desatualizado');
  });
  it('retenção de 90 dias', () => {
    expect(SYNC_HISTORY_RETENTION_DAYS).toBe(90);
  });
});

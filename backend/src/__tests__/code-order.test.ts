import { describe, it, expect } from 'vitest';
import { codeOrderIssue, saveReloadFlag } from '../lib/codeOrder';

// Caso Gets (16/10/2026): fila do Companion entregou códigos fora de ordem e a run voltou de
// 10 dias/336 abates para 8 dias/207. Também separa isso de save recarregado (backup).
describe('ordem dos códigos da mesma run', () => {
  const prev = { last_code_ts: 1_792_000_000, time_raw: 15582 };
  it('reenvio atrasado da fila (gerado antes, menos tempo) é descartado sem anomalia', () => {
    expect(codeOrderIssue(prev, { codeTimestamp: 1_791_999_000, timeRaw: 9536 })).toBe('older_code');
    expect(codeOrderIssue(prev, { codeTimestamp: 1_791_999_000, timeRaw: 15582 })).toBe('older_code');
  });
  it('código gerado depois com menos tempo de jogo = save recarregado', () => {
    expect(codeOrderIssue(prev, { codeTimestamp: 1_792_000_600, timeRaw: 14518 })).toBe('save_reload');
  });
  it('jogador acertou o relógio para trás: código "mais velho" com mais tempo de jogo é aceito', () => {
    expect(codeOrderIssue(prev, { codeTimestamp: 1_791_990_000, timeRaw: 16000 })).toBeNull();
  });
  it('progresso normal passa', () => {
    expect(codeOrderIssue(prev, { codeTimestamp: 1_792_000_600, timeRaw: 15900 })).toBeNull();
  });
  it('sem hora gravada (run antiga ou mod antigo) não compara', () => {
    expect(codeOrderIssue({ last_code_ts: null, time_raw: 15582 }, { codeTimestamp: 1_792_000_600, timeRaw: 100 })).toBeNull();
    expect(codeOrderIssue(prev, { codeTimestamp: null, timeRaw: 100 })).toBeNull();
  });
  it('PostgreSQL devolve bigint como texto', () => {
    expect(codeOrderIssue({ last_code_ts: '1792000000', time_raw: 15582 }, { codeTimestamp: 1_791_999_000, timeRaw: 9536 })).toBe('older_code');
  });
  it('anomalia registra o tempo antes e depois', () => {
    expect(saveReloadFlag(15582, 14518)).toBe('save_reload:15582>14518');
  });
});

import { describe, it, expect } from 'vitest';
import { canRestartAfterDisqualification } from '../lib/runHistory';

describe('canRestartAfterDisqualification', () => {
  it('partida nova de verdade (tempo caiu e personagem recém-criado) libera', () => {
    expect(canRestartAfterDisqualification(500, 2, 0)).toBe(true);
    expect(canRestartAfterDisqualification(500, 30, 1)).toBe(true);
  });
  it('backup restaurado de antes da violação (tempo caiu, mas já com dias) NÃO libera', () => {
    expect(canRestartAfterDisqualification(500, 200, 9)).toBe(false);
  });
  it('mesma partida (tempo não caiu pela metade) NÃO libera', () => {
    expect(canRestartAfterDisqualification(500, 480, 0)).toBe(false);
  });
});

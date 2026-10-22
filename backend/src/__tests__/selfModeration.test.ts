import { describe, it, expect } from 'vitest';
import { sameIdentity } from '../lib/selfModeration';

describe('moderação em causa própria', () => {
  it('login do moderador igual ao nick do jogador, sem diferenciar maiúsculas', () => {
    expect(sameIdentity('bone', 'Bone')).toBe(true);
    expect(sameIdentity('camarada pz', 'Camarada PZ ')).toBe(true);
  });
  it('nomes diferentes ou vazios não bloqueiam', () => {
    expect(sameIdentity('bone', 'Guto')).toBe(false);
    expect(sameIdentity('', '')).toBe(false);
    expect(sameIdentity(null, 'Bone')).toBe(false);
  });
});

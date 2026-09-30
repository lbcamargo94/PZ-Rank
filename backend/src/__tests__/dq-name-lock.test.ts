import { describe, it, expect } from 'vitest';
import { normalizeCharName } from '../lib/runHistory';

// Personagem desclassificado bloqueia o nome de vez (v4.28.5): variações mínimas do nome
// não podem virar outro personagem para driblar o bloqueio.
describe('normalizeCharName', () => {
  it('maiúsculas, acentos e espaços extras contam como o mesmo nome', () => {
    const base = normalizeCharName('Chris Pereira');
    expect(normalizeCharName('chris pereira')).toBe(base);
    expect(normalizeCharName('  Chris   Pereira ')).toBe(base);
    expect(normalizeCharName('Chrís Pereíra')).toBe(base);
  });
  it('nome realmente diferente continua diferente', () => {
    expect(normalizeCharName('Chris Pereira II')).not.toBe(normalizeCharName('Chris Pereira'));
  });
});

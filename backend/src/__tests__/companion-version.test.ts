import { describe, it, expect } from 'vitest';
import { parseCompanionVersion } from '../lib/companionVersion';

describe('parseCompanionVersion', () => {
  it('aceita versão X.Y.Z', () => {
    expect(parseCompanionVersion('2.7.0')).toBe('2.7.0');
    expect(parseCompanionVersion(' 10.0.12 ')).toBe('10.0.12');
  });
  it('recusa ausente, texto livre e formatos fora do padrão', () => {
    for (const v of [undefined, null, '', 'v2.7.0', '2.7', '2.7.0-beta', '2.7.0; DROP TABLE', '1.2.3.4', '99999.0.0']) {
      expect(parseCompanionVersion(v as string | undefined)).toBeNull();
    }
  });
});

import { describe, it, expect } from 'vitest';
import {
  COMPANION_STAT_KEYS, canonicalStats, sameCharacter, statsSignature, validateCompanionStats,
} from '../lib/companionStats';

const SECRET = 'segredo-de-teste';
const TOKEN  = 'tok-123';
const CODE   = 'PZRX9:abc';
const CHAR   = 'Lucille Rankataia';

function fullStats(overrides: Record<string, number> = {}) {
  const s: Record<string, number> = {};
  for (const k of Object.keys(COMPANION_STAT_KEYS)) s[k] = 0;
  return { ...s, houses_looted: 42, meals_cooked: 7, ...overrides };
}

function validate(stats: unknown, opts: Partial<{ character: unknown; sig: string | undefined; secret: string }> = {}) {
  const character = opts.character ?? CHAR;
  const secret    = opts.secret ?? SECRET;
  const sig = 'sig' in opts ? opts.sig
    : (stats && typeof stats === 'object' && typeof character === 'string')
      ? statsSignature(secret || 'x', TOKEN, CODE, character, stats as Record<string, unknown>)
      : undefined;
  return validateCompanionStats({
    stats, statsCharacter: character, signature: sig, secret,
    playerToken: TOKEN, code: CODE, characterName: CHAR,
  });
}

describe('stats do Companion', () => {
  it('cobre exatamente as 33 chaves que o mod grava em RankFile.saveStats', () => {
    expect(Object.keys(COMPANION_STAT_KEYS)).toHaveLength(33);
  });

  it('assinatura canônica independe da ordem das chaves', () => {
    expect(canonicalStats({ b: 2, a: 1 })).toBe('a=1&b=2');
    expect(canonicalStats({ a: 1, b: 2 })).toBe(canonicalStats({ b: 2, a: 1 }));
  });

  it('aceita stats válidas e assinadas', () => {
    const r = validate(fullStats());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.stats.houses_looted).toBe(42);
  });

  it('chave ausente conta como 0 (arquivo de mod mais antigo)', () => {
    const r = validate({ houses_looted: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.stats.houses_looted).toBe(5); expect(r.stats.eggs_collected).toBe(0); }
  });

  it('rejeita assinatura ausente ou adulterada quando há segredo', () => {
    expect(validate(fullStats(), { sig: undefined })).toEqual({ ok: false, reason: 'bad_signature' });
    const tampered = fullStats();
    const sig = statsSignature(SECRET, TOKEN, CODE, CHAR, tampered);
    expect(validate({ ...tampered, houses_looted: 99999 }, { sig })).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('assinatura não é exigida sem segredo configurado (mesma política do X-Code-Sig)', () => {
    expect(validate(fullStats(), { sig: undefined, secret: '' }).ok).toBe(true);
  });

  it('tolera diferença de encoding no nome (latin1 do código × UTF-8 do arquivo)', () => {
    expect(sameCharacter('Jéssica Ção', 'Jéssica Ção')).toBe(true);
    // bytes latin1 lidos como UTF-8: "Ç"(0xC7)+"ã"(0xE3) viram dois U+FFFD
    expect(sameCharacter('J�ssica ��o', 'Jéssica Ção')).toBe(true);
    // bytes UTF-8 lidos como latin1 (mojibake clássico)
    expect(sameCharacter('JÃ©ssica Ã‡Ã£o', 'Jéssica Ção')).toBe(true);
    expect(sameCharacter('Jessica Cao', 'Jéssica Ção')).toBe(false);
    expect(sameCharacter('Outra Pessoa', 'Jéssica Ção')).toBe(false);
  });

  it('rejeita stats de outro personagem', () => {
    expect(validate(fullStats(), { character: 'Outro Personagem' })).toEqual({ ok: false, reason: 'character_mismatch' });
  });

  it('rejeita valores negativos, fracionários, texto ou absurdos', () => {
    expect(validate(fullStats({ houses_looted: -1 })).ok).toBe(false);
    expect(validate(fullStats({ houses_looted: 1.5 })).ok).toBe(false);
    expect(validate({ ...fullStats(), houses_looted: '10' as unknown as number }).ok).toBe(false);
    expect(validate(fullStats({ houses_looted: 50_000_000 })).ok).toBe(false);
  });

  it('rejeita formato inválido', () => {
    expect(validate([1, 2, 3]).ok).toBe(false);
    expect(validate('texto').ok).toBe(false);
    expect(validate(null)).toEqual({ ok: false, reason: 'missing' });
  });
});

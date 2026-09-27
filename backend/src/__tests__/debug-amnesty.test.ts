import { describe, it, expect } from 'vitest';
import { parseReasonField } from '../lib/decoder';
import { isDebugAmnestied, newModGapFlag } from '../lib/debugAmnesty';

describe('parseReasonField', () => {
  it('motivo simples de mods antigos continua igual', () => {
    expect(parseReasonField('debug')).toEqual({ reason: 'debug', debugSeenMin: null, presetViolated: false, modGap: null });
    expect(parseReasonField('mods:NAO_PERMITIDO:X,AUSENTE:Y').reason).toBe('mods:NAO_PERMITIDO:X,AUSENTE:Y');
    expect(parseReasonField('')).toEqual({ reason: null, debugSeenMin: null, presetViolated: false, modGap: null });
  });
  it('debug com hora, preset e gap (mod 2.31.0)', () => {
    expect(parseReasonField('debug&debug_min=12150&preset=1&gap=636@6407')).toEqual({
      reason: 'debug', debugSeenMin: 12150, presetViolated: true, modGap: { minutes: 636, atMin: 6407 },
    });
  });
  it('só o aviso de gap, sem desclassificação', () => {
    expect(parseReasonField('gap=112@12140')).toEqual({
      reason: null, debugSeenMin: null, presetViolated: false, modGap: { minutes: 112, atMin: 12140 },
    });
  });
  it('extras malformados são ignorados', () => {
    expect(parseReasonField('debug&debug_min=abc&gap=12')).toEqual({ reason: 'debug', debugSeenMin: null, presetViolated: false, modGap: null });
  });
});

describe('isDebugAmnestied', () => {
  const dq = { sandboxOk: false, disqualificationReason: 'debug', debugSeenMin: 12150, presetViolated: false };
  it('debug visto até o limite da anistia passa', () => {
    expect(isDebugAmnestied(dq, 12150)).toBe(true);
    expect(isDebugAmnestied(dq, 13000)).toBe(true);
  });
  it('debug visto depois do limite desclassifica', () => {
    expect(isDebugAmnestied({ ...dq, debugSeenMin: 13001 }, 13000)).toBe(false);
  });
  it('sem anistia, sem hora (mod antigo), com preset alterado ou outro motivo: não passa', () => {
    expect(isDebugAmnestied(dq, null)).toBe(false);
    expect(isDebugAmnestied({ ...dq, debugSeenMin: null }, 13000)).toBe(false);
    expect(isDebugAmnestied({ ...dq, presetViolated: true }, 13000)).toBe(false);
    expect(isDebugAmnestied({ ...dq, disqualificationReason: 'sandbox' }, 13000)).toBe(false);
  });
});

describe('newModGapFlag', () => {
  it('gap novo vira anomalia', () => {
    expect(newModGapFlag({ minutes: 636, atMin: 6407 }, null)).toEqual({ flaggedReason: 'mod_gap:636', atMin: 6407 });
  });
  it('o mesmo gap repetido nos syncs da sessão não é registrado de novo', () => {
    expect(newModGapFlag({ minutes: 636, atMin: 6407 }, 6407)).toBeNull();
  });
  it('sem gap, nada', () => {
    expect(newModGapFlag(null, 6407)).toBeNull();
  });
});

describe('parsePzrCode com extras no motivo (mod 2.31.0)', () => {
  const encode = (plain: string) => {
    const key = Buffer.from('PZRank-Community-2026-Key!', 'utf8');
    const data = Buffer.from(plain, 'latin1');
    const out = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) out[i] = data[i]! ^ key[i % key.length]!;
    return 'PZRX9:' + out.toString('base64');
  };
  it('mantém os 13 campos slim e separa motivo/extras', async () => {
    const { parsePzrCode } = await import('../lib/decoder');
    const plain = 'PZR|Carrie Woody|Ladrão|283|12150|Axe 1|vivo|invalido|base:smoker|debug&debug_min=12150|1790000000|2.31.0||ModA;ModB';
    const d = parsePzrCode(encode(plain))!;
    expect(d.sandboxOk).toBe(false);
    expect(d.disqualificationReason).toBe('debug');
    expect(d.debugSeenMin).toBe(12150);
    expect(d.modVersion).toBe('2.31.0');
    expect(d.activeMods).toEqual(['ModA', 'ModB']);
  });
  it('run limpa só com aviso de gap', async () => {
    const { parsePzrCode } = await import('../lib/decoder');
    const plain = 'PZR|Carrie Woody|Ladrão|283|12140|Axe 1|vivo|ok|base:smoker|gap=112@12140|1790000000|2.31.0||ModA';
    const d = parsePzrCode(encode(plain))!;
    expect(d.sandboxOk).toBe(true);
    expect(d.disqualificationReason).toBeNull();
    expect(d.modGap).toEqual({ minutes: 112, atMin: 12140 });
  });
});

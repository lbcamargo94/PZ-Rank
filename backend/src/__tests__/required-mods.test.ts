import { describe, it, expect } from 'vitest';
import { missingRequiredMods } from '../lib/requiredMods';

const catalog = [
  { mod_id: 'PZCommunityRank',    status: 'active',  is_required: true },
  { mod_id: 'SpiffoStatueFix',    status: 'active',  is_required: true },
  { mod_id: 'twistonfirestats',   status: 'active',  is_required: true },
  { mod_id: 'twistonfirestatsmp', status: 'blocked', is_required: false },
  { mod_id: 'EURY_CRAFTING',      status: 'active',  is_required: false },
];

describe('missingRequiredMods', () => {
  it('lista completa: nada falta (PZCommunityRank não vem na lista do mod)', () => {
    expect(missingRequiredMods(catalog, ['SpiffoStatueFix', 'twistonfirestats', 'EURY_CRAFTING'])).toEqual([]);
  });
  it('aponta cada obrigatório ausente', () => {
    expect(missingRequiredMods(catalog, ['EURY_CRAFTING'])).toEqual(['SpiffoStatueFix', 'twistonfirestats']);
    expect(missingRequiredMods(catalog, ['SpiffoStatueFix', 'twistonfirestatsmp'])).toEqual(['twistonfirestats']);
  });
  it('ID com maiúscula diferente não conta', () => {
    expect(missingRequiredMods(catalog, ['spiffostatuefix', 'twistonfirestats'])).toEqual(['SpiffoStatueFix']);
  });
  it('obrigatório bloqueado ou não obrigatório não é cobrado', () => {
    expect(missingRequiredMods([{ mod_id: 'X', status: 'blocked', is_required: true }], ['A'])).toEqual([]);
  });
  it('lista de mods vazia (mod antigo ou falha de leitura): não avalia', () => {
    expect(missingRequiredMods(catalog, [])).toEqual([]);
  });
});

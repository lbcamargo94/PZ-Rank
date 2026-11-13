import { describe, it, expect } from 'vitest';
import { extractWorkshopId, canonicalWorkshopUrl, modIdError } from '../lib/modInput';

describe('extractWorkshopId', () => {
  it('lê o formato com ?id=', () => {
    expect(extractWorkshopId('https://steamcommunity.com/sharedfiles/filedetails/?id=3480305133')).toBe('3480305133');
    expect(extractWorkshopId('https://steamcommunity.com/sharedfiles/filedetails/?l=pt&id=42')).toBe('42');
  });
  it('lê o formato sem ?id= (/filedetails/<id>)', () => {
    expect(extractWorkshopId('https://steamcommunity.com/sharedfiles/filedetails/2710167561')).toBe('2710167561');
    expect(extractWorkshopId('https://steamcommunity.com/sharedfiles/filedetails/2710167561/')).toBe('2710167561');
  });
  it('retorna null sem número de item', () => {
    expect(extractWorkshopId('https://steamcommunity.com/id/alguem')).toBeNull();
  });
});

describe('canonicalWorkshopUrl', () => {
  it('reescreve para o formato com ?id=', () => {
    expect(canonicalWorkshopUrl('https://steamcommunity.com/sharedfiles/filedetails/2710167561'))
      .toBe('https://steamcommunity.com/sharedfiles/filedetails/?id=2710167561');
    expect(canonicalWorkshopUrl('https://steamcommunity.com/sharedfiles/filedetails/?id=5&searchtext=x'))
      .toBe('https://steamcommunity.com/sharedfiles/filedetails/?id=5');
  });
  it('mantém links que não são de item', () => {
    expect(canonicalWorkshopUrl('https://steamcommunity.com/id/alguem')).toBe('https://steamcommunity.com/id/alguem');
  });
});

describe('modIdError', () => {
  it('aceita IDs reais, inclusive com espaço', () => {
    expect(modIdError(null)).toBeNull();
    expect(modIdError('twistonfirestatsmpstable')).toBeNull();
    expect(modIdError('Saint Hairstyles')).toBeNull();
    expect(modIdError('RUNE-EXP')).toBeNull();
    expect(modIdError("Yaki's-Hair-Salon-Patch-Lite-B42")).toBeNull();
  });
  it('recusa a descrição colada no lugar do ID', () => {
    expect(modIdError('Indicadores OBRIGATÓRIOS "Tempo vivo, Kills, Peso e Tempo de jogo"')).not.toBeNull();
    expect(modIdError('x'.repeat(101))).not.toBeNull();
    expect(modIdError('a,b')).not.toBeNull();
    expect(modIdError('a\nb')).not.toBeNull();
    expect(modIdError('.')).not.toBeNull();
  });
});

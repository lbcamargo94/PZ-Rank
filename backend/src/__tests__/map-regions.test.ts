import { describe, it, expect } from 'vitest';
import { deathCellFromDelta, regionAt, regionOfCell } from '../lib/mapRegions';

describe('regionAt', () => {
  it('rótulos oficiais caem na própria cidade', () => {
    expect(regionAt(10754, 9926)).toBe('Muldraugh');
    expect(regionAt(11654, 6864)).toBe('WestPoint');
    expect(regionAt(8159, 11661)).toBe('Rosewood');
    expect(regionAt(6450, 5430)).toBe('Riverside');
    expect(regionAt(13077, 2238)).toBe('Louisville');
    expect(regionAt(10130, 12801)).toBe('MarchRidge');
  });

  it('Valley Station vence o condado de Jefferson que a envolve', () => {
    expect(regionAt(13447, 5278)).toBe('ValleyStation');
  });

  it('cidades do B42 sem área oficial: pelo raio do rótulo', () => {
    expect(regionAt(2056, 6070)).toBe('Brandenburg');
    expect(regionAt(634, 9746)).toBe('Ekron');
    expect(regionAt(2427, 14185)).toBe('Irvington');
    expect(regionAt(3589, 10952)).toBe('EchoCreek');
    expect(regionAt(7253, 8279)).toBe('FallasLake');
  });

  it('base militar secreta tem prioridade', () => {
    expect(regionAt(5600, 12450)).toBe('MilitaryBase');
  });

  it('longe de tudo = zona rural', () => {
    expect(regionAt(100, 100)).toBe('Rural');
    expect(regionAt(Number.NaN, 5)).toBe('Rural');
  });

  it('célula do mapa de calor usa o centro', () => {
    expect(regionOfCell(107, 99)).toBe('Muldraugh');   // 10750, 9950
  });
});

describe('deathCellFromDelta', () => {
  it('pega o ponto de morte e ignora abates/base', () => {
    expect(deathCellFromDelta([
      { type: 'kill', gx: 1, gy: 2, count: 50 },
      { type: 'death', gx: 107, gy: 99, count: 1 },
    ])).toEqual({ gx: 107, gy: 99 });
    expect(deathCellFromDelta([{ type: 'base', gx: 1, gy: 2 }])).toBeNull();
    expect(deathCellFromDelta('lixo')).toBeNull();
    expect(deathCellFromDelta([{ type: 'death', gx: -1, gy: 5 }])).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { isImplausibleTotal, isImplausibleJump, implausibleFlag } from '../lib/plausibility';

describe('trava de plausibilidade dos abates', () => {
  it('caso Anastacia Glubby (400.000 abates em 56 h) é barrado', () => {
    expect(isImplausibleTotal(400000, 3368)).toBe(true);
  });
  it('maiores runs reais de produção passam com folga', () => {
    expect(isImplausibleTotal(138238, 634819)).toBe(false); // Lucille Rankataia, 13/h
    expect(isImplausibleTotal(90000, 424552)).toBe(false);
  });
  it('começo de run com horda grande passa (folga fixa)', () => {
    expect(isImplausibleTotal(250, 30)).toBe(false);
    expect(isImplausibleTotal(350, 60)).toBe(false);
  });
  it('salto entre syncs impossível para o tempo jogado é barrado', () => {
    expect(isImplausibleJump({ kills: 1000, time_raw: 10000 }, 50000, 10060)).toBe(true);
    expect(isImplausibleJump({ kills: 1000, time_raw: 10000 }, 1300, 10060)).toBe(false);
  });
  it('run nova (tempo regrediu) não compara salto', () => {
    expect(isImplausibleJump({ kills: 50000, time_raw: 90000 }, 10, 60)).toBe(false);
  });
  it('anomalia registra abates e tempo', () => {
    expect(implausibleFlag(400000, 3368)).toBe('implausible_kills:400000@3368');
  });
});

import { isImplausibleSkillTotal, skillChangeIssue, parseSkillLevels, skillLevelSum } from '../lib/plausibility';

describe('trava de habilidades', () => {
  it('Aptidão Física e Força ficam fora da conta', () => {
    expect(parseSkillLevels('Aptidão Física 9, Força 9, Machado 3')).toEqual({ Machado: 3 });
    expect(skillLevelSum(['Força 10', 'Carpintaria 4'])).toBe(4);
  });
  it('personagem novo com profissão e traços passa (folga de 40 níveis)', () => {
    expect(isImplausibleSkillTotal('Machado 3, Carpintaria 3, Pesca 3, Forrageamento 3, Mira 2', 0)).toBe(false);
  });
  it('várias habilidades em 7-10 com 56 h de jogo é barrado', () => {
    const maxed = ['Machado', 'Contundente', 'Cont. Curto', 'Lâmina Longa', 'Lâmina Curta', 'Lança', 'Manutenção',
      'Mira', 'Recarga', 'Carpintaria', 'Eletricidade', 'Soldagem', 'Mecânica', 'Costura'].map(n => `${n} 8`);
    expect(isImplausibleSkillTotal(maxed, 3368)).toBe(true);
  });
  it('salto grande sem tempo entre syncs é recusado', () => {
    expect(skillChangeIssue({ skills: 'Machado 1, Lança 1', time_raw: 3000 }, ['Machado 10', 'Lança 9'], 3010)).toBe('jump');
  });
  it('subida normal de um nível passa', () => {
    expect(skillChangeIssue({ skills: 'Machado 4', time_raw: 3000 }, ['Machado 5'], 3060)).toBeNull();
  });
  it('habilidade que caiu vira só aviso; Força caindo não conta', () => {
    expect(skillChangeIssue({ skills: 'Machado 8, Força 6', time_raw: 3000 }, ['Machado 0', 'Força 6'], 3010)).toBe('decrease');
    expect(skillChangeIssue({ skills: 'Machado 8, Força 6', time_raw: 3000 }, ['Machado 8', 'Força 3'], 3010)).toBeNull();
  });
  it('run nova (tempo regrediu) não compara', () => {
    expect(skillChangeIssue({ skills: 'Machado 10', time_raw: 90000 }, ['Machado 0'], 60)).toBeNull();
  });
});

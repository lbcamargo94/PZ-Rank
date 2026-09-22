/**
 * Testes do filtro de conteúdo de live (backend/src/lib/championship.ts).
 *
 * Regressão: uma live de outro desafio de Project Zomboid ("Legendoid Challenge
 * x16 True Zero to Hero") foi notificada no Discord como se fosse do Brasileirão
 * PZ, porque o filtro antigo casava com o keyword genérico "zomboid"/"project
 * zomboid" — presente em praticamente toda descrição de live de PZ, campeonato
 * ou não.
 */

import { describe, it, expect } from 'vitest';
import { isChampionshipTitle, isChampionshipTwitchGame } from '../lib/championship';

describe('isChampionshipTitle', () => {
  it('reconhece títulos com o nome do campeonato', () => {
    expect(isChampionshipTitle('BRASILEIRÃO PZ - dia 12, base montada!')).toBe(true);
    expect(isChampionshipTitle('brasileirao de project zomboid ao vivo')).toBe(true);
    expect(isChampionshipTitle('Jogando #BrasileiraoPZ')).toBe(true);
    expect(isChampionshipTitle('Campeonato Brasileiro de Sobrevivência - PZ')).toBe(true);
  });

  it('reconhece pelo nome do site na descrição, mesmo sem estar no título', () => {
    expect(isChampionshipTitle('Live de hoje', 'Participando do PZ Rank, bora ver como vai')).toBe(true);
    expect(isChampionshipTitle('Live de hoje', 'pzrank.com.br')).toBe(true);
  });

  it('NÃO reconhece uma live de Project Zomboid que não é do campeonato (regressão)', () => {
    // Caso real reportado: notificação disparada indevidamente porque a
    // descrição citava "Project Zomboid" (como qualquer live do jogo cita).
    expect(isChampionshipTitle(
      'Legendoid Challenge x16 True Zero to Hero',
      'Hoje jogando Project Zomboid no desafio Legendoid, run difícil!',
    )).toBe(false);
  });

  it('NÃO reconhece título/descrição genéricos do jogo sem menção ao campeonato', () => {
    expect(isChampionshipTitle('Project Zomboid ao vivo')).toBe(false);
    expect(isChampionshipTitle('Jogando zomboid hoje', 'só sobrevivendo por aí')).toBe(false);
    expect(isChampionshipTitle('Live qualquer', '')).toBe(false);
  });

  it('é case-insensitive e ignora description ausente', () => {
    expect(isChampionshipTitle('PZRANK AO VIVO')).toBe(true);
    expect(isChampionshipTitle('nada a ver', undefined)).toBe(false);
    expect(isChampionshipTitle('nada a ver', null)).toBe(false);
  });
});

describe('isChampionshipTwitchGame', () => {
  it('reconhece apenas a categoria oficial "Project Zomboid"', () => {
    expect(isChampionshipTwitchGame('Project Zomboid')).toBe(true);
    expect(isChampionshipTwitchGame('project zomboid')).toBe(true);
    expect(isChampionshipTwitchGame('  Project Zomboid  ')).toBe(true);
  });

  it('rejeita outras categorias e valores vazios', () => {
    expect(isChampionshipTwitchGame('Just Chatting')).toBe(false);
    expect(isChampionshipTwitchGame(null)).toBe(false);
    expect(isChampionshipTwitchGame('')).toBe(false);
  });
});

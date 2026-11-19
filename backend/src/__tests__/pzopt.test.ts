import { describe, it, expect } from 'vitest';
import { isPzoptPermitted } from '../lib/pzopt';

describe('isPzoptPermitted', () => {
  it('sem cadastro do PZO continua proibido', () => {
    expect(isPzoptPermitted([{ mod_id: 'ZombieBuddy', workshop_id: '3619862853', status: 'active' }])).toBe(false);
  });

  it('cadastrado como permitido libera', () => {
    expect(isPzoptPermitted([{ mod_id: 'PZ_Optimization', workshop_id: '3805285544', status: 'active' }])).toBe(true);
  });

  it('reconhece pelo ID da Oficina mesmo com outro mod_id', () => {
    expect(isPzoptPermitted([{ mod_id: 'OutroNome', workshop_id: 3805285544, status: 'active' }])).toBe(true);
  });

  it('qualquer cadastro bloqueado proíbe', () => {
    expect(isPzoptPermitted([
      { mod_id: 'PZ_Optimization', workshop_id: '3805285544', status: 'active' },
      { mod_id: 'MPOptimizer', workshop_id: '3787481250', status: 'blocked' },
    ])).toBe(false);
  });

  it('só bloqueado proíbe', () => {
    expect(isPzoptPermitted([{ mod_id: 'PZ_Optimization', status: 'blocked' }])).toBe(false);
  });
});

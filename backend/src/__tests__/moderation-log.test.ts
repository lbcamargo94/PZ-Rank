import { describe, it, expect } from 'vitest';
import { describeAction, sanitizeDetails, parseTarget } from '../lib/moderationLog';

describe('registro das ações da moderação', () => {
  it('identifica o alvo pela rota', () => {
    expect(parseTarget('/842/status')).toEqual({ id: 842, subpath: 'status' });
    expect(parseTarget('/842')).toEqual({ id: 842, subpath: '' });
    expect(parseTarget('/')).toEqual({ id: null, subpath: '' });
  });
  it('nomeia as ações de status de run pelo corpo', () => {
    expect(describeAction('entries', 'PATCH', 'status', { sandbox_ok: false, note: 'Trapaça' })).toBe('desclassificar_run');
    expect(describeAction('entries', 'PATCH', 'status', { is_alive: true, sandbox_ok: true })).toBe('reabilitar_run');
    expect(describeAction('entries', 'PATCH', 'status', { is_alive: false, sandbox_ok: true })).toBe('reabilitar_run_morta');
    expect(describeAction('entries', 'PATCH', 'status', { is_alive: false })).toBe('marcar_morta');
  });
  it('nomeia as demais ações de runs e jogadores', () => {
    expect(describeAction('entries', 'PATCH', 'clear-anomaly', null)).toBe('limpar_anomalia');
    expect(describeAction('entries', 'DELETE', '', null)).toBe('remover_run');
    expect(describeAction('players', 'DELETE', 'permanent', null)).toBe('excluir_jogador_permanente');
    expect(describeAction('players', 'PATCH', 'block', { reason: 'x' })).toBe('bloquear_jogador');
  });
  it('não guarda dados pessoais: e-mail e links entram só como "alterado"', () => {
    expect(JSON.parse(sanitizeDetails({ email: 'a@b.com', note: 'Motivo' })!)).toEqual({ email: 'alterado', note: 'Motivo' });
    expect(JSON.parse(sanitizeDetails({ youtube_url: 'https://x', sandbox_ok: false })!)).toEqual({ youtube_url: 'alterado', sandbox_ok: false });
    expect(sanitizeDetails(null)).toBeNull();
  });
});

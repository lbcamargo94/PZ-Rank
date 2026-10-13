import { describe, it, expect } from 'vitest';
import { computeModStats, type StatsRun, type StatsMod } from '../lib/modStats';

const now = new Date('2026-10-13T12:00:00Z');
const run = (pid: number, mods: string[] | null, extra: Partial<StatsRun> = {}): StatsRun => ({
  player_id: pid, nick: `p${pid}`, character_name: `c${pid}`, active_mods: mods === null ? null : JSON.stringify(mods),
  updated_at: '2026-10-12T12:00:00Z', is_alive: true, sandbox_ok: true, ...extra,
});
const mods: StatsMod[] = [
  { mod_id: 'VVA_a', name: 'Vanilla vehicles animated', workshop_id: '111', status: 'active', is_required: false },
  { mod_id: 'VVA_b', name: 'Vanilla vehicles animated', workshop_id: '111', status: 'active', is_required: false },
  { mod_id: 'Ruim',  name: 'Mod Bloqueado',             workshop_id: '222', status: 'blocked', is_required: false },
  { mod_id: 'Parado', name: 'Ninguém usa',              workshop_id: '333', status: 'active', is_required: true },
];

describe('estatísticas de uso dos mods', () => {
  it('conta cada participante uma vez por item da Oficina, mesmo com vários IDs', () => {
    const r = computeModStats([run(1, ['VVA_a', 'VVA_b']), run(2, ['VVA_b'])], mods, 14, now);
    const vva = r.items.find(i => i.key === 'w-111')!;
    expect(vva.players).toBe(2);
    expect(vva.percent).toBe(100);
    expect(vva.mod_ids).toEqual(['VVA_a', 'VVA_b']);
  });
  it('fora do período, morta ou desclassificada não conta como participante', () => {
    const r = computeModStats([
      run(1, ['VVA_a']),
      run(2, ['VVA_a'], { updated_at: '2026-09-01T00:00:00Z' }),
      run(3, ['VVA_a'], { is_alive: false }),
      run(4, ['VVA_a'], { sandbox_ok: false }),
    ], mods, 14, now);
    expect(r.participants).toBe(1);
    expect(r.items.find(i => i.key === 'w-111')!.players).toBe(1);
  });
  it('"todas as runs vivas" ignora o período', () => {
    const r = computeModStats([run(1, ['VVA_a']), run(2, ['VVA_a'], { updated_at: '2026-01-01T00:00:00Z' })], mods, null, now);
    expect(r.participants).toBe(2);
  });
  it('mostra bloqueado em uso, cadastrado sem uso e mod fora do cadastro', () => {
    const r = computeModStats([run(1, ['Ruim', 'Desconhecido']), run(2, [])], mods, 14, now);
    expect(r.items.find(i => i.key === 'w-222')).toMatchObject({ status: 'bloqueado', players: 1 });
    expect(r.items.find(i => i.key === 'u-Desconhecido')).toMatchObject({ status: 'nao_cadastrado', players: 1 });
    expect(r.summary.unregistered_in_use).toBe(1);
    expect(r.summary.registered_unused).toBe(2);   // VVA e "Ninguém usa"
    expect(r.items.find(i => i.key === 'w-333')!.required).toBe(true);
  });
  it('jogador com duas runs vivas conta uma vez (a mais recente)', () => {
    const r = computeModStats([
      run(1, ['VVA_a'], { updated_at: '2026-10-10T00:00:00Z', character_name: 'antiga' }),
      run(1, ['Ruim'],  { updated_at: '2026-10-12T00:00:00Z', character_name: 'nova' }),
    ], mods, 14, now);
    expect(r.participants).toBe(1);
    expect(r.players[1]!.character).toBe('nova');
    expect(r.items.find(i => i.key === 'w-111')!.players).toBe(0);
  });
  it('média de mods por participante', () => {
    const r = computeModStats([run(1, ['VVA_a', 'Ruim']), run(2, [])], mods, 14, now);
    expect(r.summary.avg_mods_per_participant).toBe(1);
  });
});

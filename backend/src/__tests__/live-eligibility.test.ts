/**
 * Quem pode aparecer no canal de lives do Discord (backend/src/lib/liveEligibility.ts):
 * só jogador aprovado, ativo, não bloqueado, sem alerta de ban e com run viva e válida.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));
vi.mock('../supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

import { liveNotificationBlock, canAnnounceLive } from '../lib/liveEligibility';

type Player = { id: number; status: string; deleted_at: string | null; blocked: boolean | number; ban_match: string | null };

const OK_PLAYER: Player = { id: 1, status: 'approved', deleted_at: null, blocked: false, ban_match: null };

// Encadeamento mínimo: players termina em maybeSingle(); entries termina em limit().
type Last = { sandbox_ok: boolean; updated_at: string | null };
const NOW = new Date('2026-11-07T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

function setup(player: Player | null, runs: Array<{ id: number }>, filters: Record<string, unknown>[] = [], last: Last[] = []) {
  fromMock.mockImplementation((table: string) => {
    const seen: Record<string, unknown> = { table };
    filters.push(seen);
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = (col: string, val: unknown) => { seen[col] = val; return chain; };
    chain.is = (col: string, val: unknown) => { seen[`${col}:is`] = val; return chain; };
    chain.maybeSingle = async () => ({ data: player, error: null });
    chain.order = () => chain;
    chain.limit = async () => ({ data: 'is_alive' in seen ? runs : last, error: null });
    return chain;
  });
}

beforeEach(() => { fromMock.mockReset(); vi.spyOn(console, 'log').mockImplementation(() => {}); });

describe('liveNotificationBlock', () => {
  it('libera jogador aprovado com run viva e válida', async () => {
    const filters: Record<string, unknown>[] = [];
    setup(OK_PLAYER, [{ id: 10 }], filters);
    expect(await liveNotificationBlock(1, NOW)).toBeNull();
    const entries = filters.find(f => f.table === 'entries')!;
    expect(entries).toMatchObject({ player_id: 1, is_alive: true, sandbox_ok: true, 'deleted_at:is': null });
  });

  it('sem nenhuma run: bloqueia', async () => {
    setup(OK_PLAYER, []);
    expect(await liveNotificationBlock(1, NOW)).toBe('no_valid_run');
  });

  it('acabou de morrer com run válida: anuncia por até 14 dias', async () => {
    setup(OK_PLAYER, [], [], [{ sandbox_ok: true, updated_at: daysAgo(3) }]);
    expect(await liveNotificationBlock(1, NOW)).toBeNull();
    setup(OK_PLAYER, [], [], [{ sandbox_ok: true, updated_at: daysAgo(13.9) }]);
    expect(await liveNotificationBlock(1, NOW)).toBeNull();
  });

  it('sem run há mais de 14 dias (ex.: só joga outro campeonato): bloqueia', async () => {
    setup(OK_PLAYER, [], [], [{ sandbox_ok: true, updated_at: daysAgo(15) }]);
    expect(await liveNotificationBlock(1, NOW)).toBe('no_valid_run');
    setup(OK_PLAYER, [], [], [{ sandbox_ok: true, updated_at: null }]);
    expect(await liveNotificationBlock(1, NOW)).toBe('no_valid_run');
  });

  it('última run desclassificada: bloqueia mesmo dentro do prazo', async () => {
    setup(OK_PLAYER, [], [], [{ sandbox_ok: false, updated_at: daysAgo(1) }]);
    expect(await liveNotificationBlock(1, NOW)).toBe('disqualified');
  });

  it('bloqueia conta pendente, recusada, apagada, bloqueada ou com alerta de ban', async () => {
    setup({ ...OK_PLAYER, status: 'pending' }, [{ id: 1 }]);
    expect(await liveNotificationBlock(1)).toBe('not_approved');
    setup({ ...OK_PLAYER, status: 'rejected' }, [{ id: 1 }]);
    expect(await liveNotificationBlock(1)).toBe('not_approved');
    setup({ ...OK_PLAYER, deleted_at: '2026-11-01' }, [{ id: 1 }]);
    expect(await liveNotificationBlock(1)).toBe('deleted');
    setup({ ...OK_PLAYER, blocked: 1 }, [{ id: 1 }]);
    expect(await liveNotificationBlock(1)).toBe('blocked');
    setup({ ...OK_PLAYER, ban_match: 'twitch: x' }, [{ id: 1 }]);
    expect(await liveNotificationBlock(1)).toBe('ban_match');
    setup(null, [{ id: 1 }]);
    expect(await liveNotificationBlock(1)).toBe('player_not_found');
  });

  it('erro na consulta não anuncia', async () => {
    fromMock.mockImplementation(() => {
      const chain: Record<string, unknown> = {};
      chain.select = () => chain; chain.eq = () => chain;
      chain.maybeSingle = async () => ({ data: null, error: { message: 'down' } });
      return chain;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await canAnnounceLive(1, 'x')).toBe(false);
  });
});

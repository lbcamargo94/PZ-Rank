/**
 * Testes das notificações de mod list no Discord (backend/src/lib/discord.ts).
 *
 * Cobre:
 *  1. Payload/embed correto para cada evento (permitido / removido / bloqueado)
 *  2. "Status anterior" dinâmico em notifyModBlocked (Permitido vs Não listado)
 *  3. Campo "Motivo" só aparece quando há block_reason
 *  4. Webhook não configurado → não chama fetch (não quebra o fluxo)
 *  5. Falha de rede / resposta não-ok do Discord → não lança exceção
 *  6. A URL do webhook nunca aparece nos logs de erro
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notifyModAllowed, notifyModRemoved, notifyModBlocked } from '../lib/discord';

const WEBHOOK_URL = 'https://discord.com/api/webhooks/123/test-secret-token';

const BASE_PAYLOAD = {
  name:        'Brita\'s Dynamic Traits',
  modId:       'DynamicTraits',
  workshopId:  '2698095102',
  workshopUrl: 'https://steamcommunity.com/sharedfiles/filedetails/?id=2698095102',
  moderator:   'lbcamargo',
};

function mockFetchOk() {
  return vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response);
}

describe('notificações de mod list — Discord', () => {
  let originalWebhook: string | undefined;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalWebhook = process.env.DISCORD_MODLIST_WEBHOOK_URL;
    originalFetch    = global.fetch;
    process.env.DISCORD_MODLIST_WEBHOOK_URL = WEBHOOK_URL;
  });

  afterEach(() => {
    if (originalWebhook === undefined) delete process.env.DISCORD_MODLIST_WEBHOOK_URL;
    else process.env.DISCORD_MODLIST_WEBHOOK_URL = originalWebhook;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ── 1. Mod permitido ────────────────────────────────────────────────────

  it('notifyModAllowed envia embed verde com status Permitido', async () => {
    const fetchMock = mockFetchOk();
    global.fetch = fetchMock as unknown as typeof fetch;

    await notifyModAllowed(BASE_PAYLOAD);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(WEBHOOK_URL);

    const body = JSON.parse((init as RequestInit).body as string);
    const embed = body.embeds[0];
    expect(embed.title).toBe('✅ Novo mod permitido');
    expect(embed.color).toBe(0x43B581);
    expect(embed.url).toBe(BASE_PAYLOAD.workshopUrl);
    expect(embed.fields).toEqual(
      expect.arrayContaining([
        { name: 'Mod',         value: BASE_PAYLOAD.name,       inline: false },
        { name: 'Workshop ID', value: BASE_PAYLOAD.workshopId, inline: true },
        { name: 'Mod ID',      value: BASE_PAYLOAD.modId,      inline: true },
        { name: 'Status',      value: '🟢 Permitido',          inline: true },
        { name: 'Responsável', value: BASE_PAYLOAD.moderator,  inline: true },
      ])
    );
  });

  // ── 2. Mod removido da lista de permitidos ──────────────────────────────

  it('notifyModRemoved envia embed laranja com status anterior/novo corretos', async () => {
    const fetchMock = mockFetchOk();
    global.fetch = fetchMock as unknown as typeof fetch;

    await notifyModRemoved(BASE_PAYLOAD);

    const body  = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    const embed = body.embeds[0];
    expect(embed.title).toBe('⚠️ Mod removido da lista de permitidos');
    expect(embed.color).toBe(0xFAA61A);
    expect(embed.fields).toEqual(
      expect.arrayContaining([
        { name: 'Status anterior', value: '🟢 Permitido',   inline: true },
        { name: 'Novo status',     value: '⚪ Não listado', inline: true },
      ])
    );
  });

  // ── 3. Mod bloqueado ─────────────────────────────────────────────────────

  it('notifyModBlocked com previousStatus=active mostra "Status anterior: Permitido"', async () => {
    const fetchMock = mockFetchOk();
    global.fetch = fetchMock as unknown as typeof fetch;

    await notifyModBlocked({ ...BASE_PAYLOAD, previousStatus: 'active', reason: null });

    const body  = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    const embed = body.embeds[0];
    expect(embed.title).toBe('🚫 Mod bloqueado');
    expect(embed.color).toBe(0xE04040);
    expect(embed.fields).toEqual(
      expect.arrayContaining([
        { name: 'Status anterior', value: '🟢 Permitido',   inline: true },
        { name: 'Novo status',     value: '🔴 Bloqueado',   inline: true },
      ])
    );
  });

  it('notifyModBlocked com previousStatus=null mostra "Status anterior: Não listado"', async () => {
    const fetchMock = mockFetchOk();
    global.fetch = fetchMock as unknown as typeof fetch;

    await notifyModBlocked({ ...BASE_PAYLOAD, previousStatus: null, reason: null });

    const body  = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    const embed = body.embeds[0];
    expect(embed.fields).toEqual(
      expect.arrayContaining([
        { name: 'Status anterior', value: '⚪ Não listado', inline: true },
      ])
    );
  });

  it('notifyModBlocked inclui campo Motivo apenas quando há block_reason', async () => {
    const fetchMock = mockFetchOk();
    global.fetch = fetchMock as unknown as typeof fetch;

    await notifyModBlocked({ ...BASE_PAYLOAD, previousStatus: 'active', reason: 'Dano exagerado em PvP' });
    const withReason = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string).embeds[0];
    expect(withReason.fields).toEqual(
      expect.arrayContaining([{ name: 'Motivo', value: 'Dano exagerado em PvP', inline: false }])
    );

    fetchMock.mockClear();
    await notifyModBlocked({ ...BASE_PAYLOAD, previousStatus: 'active', reason: null });
    const withoutReason = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string).embeds[0];
    expect(withoutReason.fields.some((f: { name: string }) => f.name === 'Motivo')).toBe(false);
  });

  // ── 4. Webhook não configurado ───────────────────────────────────────────

  it('não chama fetch quando DISCORD_MODLIST_WEBHOOK_URL não está configurada', async () => {
    delete process.env.DISCORD_MODLIST_WEBHOOK_URL;
    const fetchMock = mockFetchOk();
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(notifyModAllowed(BASE_PAYLOAD)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ── 5. Falhas do Discord não devem propagar ──────────────────────────────

  it('não lança exceção quando o Discord responde com erro HTTP', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response) as unknown as typeof fetch;
    await expect(notifyModAllowed(BASE_PAYLOAD)).resolves.toBeUndefined();
  });

  it('não lança exceção quando o fetch rejeita (timeout/rede fora do ar)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    await expect(notifyModBlocked({ ...BASE_PAYLOAD, previousStatus: 'active', reason: null })).resolves.toBeUndefined();
  });

  // ── 6. A URL do webhook não deve vazar em logs ───────────────────────────

  it('não imprime a URL do webhook no console em caso de falha', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy  = vi.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = vi.fn().mockRejectedValue(new Error('boom')) as unknown as typeof fetch;

    await notifyModRemoved(BASE_PAYLOAD);

    const allLoggedText = [...errorSpy.mock.calls, ...warnSpy.mock.calls].flat().map(String).join(' ');
    expect(allLoggedText).not.toContain(WEBHOOK_URL);
  });
});

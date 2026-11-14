import { describe, it, expect } from 'vitest';
import {
  categoriesFromTags, cleanCategoryOverride, resolveCategories, parseStringList, MOD_CATEGORIES,
} from '../lib/modCategories';
import { parseDetails, fetchWorkshopDetails } from '../lib/steamWorkshop';
import { disqModsLink } from '../lib/discord';

describe('categoriesFromTags', () => {
  it('agrupa as tags da Steam nas categorias do site, na ordem da lista', () => {
    expect(categoriesFromTags(['QOL', 'Interface'])).toEqual(['interface']);
    expect(categoriesFromTags(['Vehicles', 'Textures'])).toEqual(['visual', 'mapas']);
    expect(categoriesFromTags(['Language/Translation'])).toEqual(['traducao']);
    expect(categoriesFromTags(['building', 'Framework'])).toEqual(['jogabilidade', 'bibliotecas']);
  });
  it('não diferencia maiúscula', () => {
    expect(categoriesFromTags(['BUILDING'])).toEqual(['jogabilidade']);
  });
  it('item sem tag útil fica em "outros"', () => {
    expect(categoriesFromTags([])).toEqual(['outros']);
    expect(categoriesFromTags(['Misc', 'Build 42'])).toEqual(['outros']);
  });
  it('as 9 categorias têm slug único', () => {
    const slugs = MOD_CATEGORIES.map(c => c.slug);
    expect(slugs).toHaveLength(9);
    expect(new Set(slugs).size).toBe(9);
  });
});

describe('cleanCategoryOverride e resolveCategories', () => {
  it('aceita só categorias conhecidas, sem repetir, na ordem da lista', () => {
    expect(cleanCategoryOverride(['mapas', 'interface', 'mapas', 'xyz'])).toEqual(['interface', 'mapas']);
    expect(cleanCategoryOverride(['outros'])).toEqual(['outros']);
  });
  it('lista vazia, inválida ou que não é lista vira null', () => {
    expect(cleanCategoryOverride([])).toBeNull();
    expect(cleanCategoryOverride(['xyz'])).toBeNull();
    expect(cleanCategoryOverride('mapas')).toBeNull();
  });
  it('a categoria do moderador vence as tags', () => {
    expect(resolveCategories('["Interface"]', '["mapas"]')).toEqual(['mapas']);
    expect(resolveCategories('["Interface"]', null)).toEqual(['interface']);
    expect(resolveCategories(null, null)).toEqual(['outros']);
  });
  it('tolera JSON quebrado vindo do banco', () => {
    expect(parseStringList('{quebrado')).toEqual([]);
    expect(resolveCategories('{quebrado', 'x')).toEqual(['outros']);
  });
});

describe('parseDetails (resposta da Steam)', () => {
  it('extrai tags úteis, inscritos e data; ignora item que a Steam não achou', () => {
    const out = parseDetails([
      { publishedfileid: '1', result: 1, title: 'A', subscriptions: 2100,
        time_updated: 1_760_000_000, tags: [{ tag: 'Build 42' }, { tag: 'QOL' }, { tag: 'QOL' }, { tag: 'Multiplayer' }] },
      { publishedfileid: '2', result: 9 },
    ]);
    expect(out).toEqual([{
      workshop_id: '1', title: 'A', tags: ['QOL'], subscriptions: 2100,
      steam_updated_at: new Date(1_760_000_000 * 1000).toISOString(),
    }]);
  });
});

describe('fetchWorkshopDetails', () => {
  it('consulta em lotes de 100 itens', async () => {
    const bodies: string[] = [];
    const fake = (async (_url: string, init: { body: string }) => {
      bodies.push(init.body);
      return { ok: true, json: async () => ({ response: { publishedfiledetails: [] } }) };
    }) as unknown as typeof fetch;
    const ids = Array.from({ length: 150 }, (_, i) => String(1000 + i));
    await fetchWorkshopDetails(ids, fake);
    expect(bodies).toHaveLength(2);
    expect(new URLSearchParams(bodies[0]).get('itemcount')).toBe('100');
    expect(new URLSearchParams(bodies[1]).get('itemcount')).toBe('50');
  });
  it('erro HTTP da Steam vira exceção (o cron registra e tenta no dia seguinte)', async () => {
    const fake = (async () => ({ ok: false, status: 503 })) as unknown as typeof fetch;
    await expect(fetchWorkshopDetails(['1'], fake)).rejects.toThrow('503');
  });
});


describe('disqModsLink (aviso de desclassificação no Discord)', () => {
  it('mod bloqueado: lista filtrada pelo ID', () => {
    expect(disqModsLink('blocked_mod:Helicopter::Pz-Helicopter-Events-Spawn', 'https://www.pzrank.com.br/'))
      .toBe('[Ver na lista](https://www.pzrank.com.br/mods-lista?q=Pz-Helicopter-Events-Spawn)');
  });
  it('obrigatório ausente: também abre a conferência da lista', () => {
    expect(disqModsLink('missing_required:twistonfirestats', 'https://x.br')).toBe('[Conferir minha lista de mods](https://x.br/mods-lista?conferir=1)');
  });
  it('mod fora do cadastro: abre a conferência da lista', () => {
    expect(disqModsLink('unlisted_mods:A,B', 'https://x.br')).toBe('[Conferir minha lista de mods](https://x.br/mods-lista?conferir=1)');
  });
  it('motivo sem mod: sem link', () => {
    expect(disqModsLink('debug', 'https://x.br')).toBeNull();
    expect(disqModsLink('local_mods:A', 'https://x.br')).toBeNull();
  });
});

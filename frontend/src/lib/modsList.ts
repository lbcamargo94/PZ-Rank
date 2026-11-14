// Lógica da página pública "Mods do Campeonato" (/mods-lista), separada da tela
// para ser testável: agrupamento por item da Oficina, busca e ordenação.
import type { Mod, ModUsageResponse } from '../types';

export type ModGroupStatus = 'allowed' | 'blocked' | 'mixed';
export type ModSort = 'az' | 'recent' | 'used';

export interface ModGroup {
  key:        string;
  mods:       Mod[];
  primary:    Mod;
  workshopId: string | null;
  status:     ModGroupStatus;
  required:   boolean;
  /** Quando o item entrou na lista: o cadastro mais antigo entre os IDs do item. */
  addedAt:    number;
  sortKey:    string;
  letter:     string;
  /** Categorias do site (v4.34.0). "outros" quando o item ainda não tem tag útil. */
  categories:    string[];
  /** Inscritos atuais na Oficina; null se o cron ainda não buscou. */
  subscriptions: number | null;
  /** Última atualização do item na Oficina (ms); 0 se desconhecida. */
  steamUpdatedAt: number;
  /** Participantes usando o item agora; null até o uso carregar. */
  players:       number | null;
}

// Mesmos slugs de backend/src/lib/modCategories.ts, na mesma ordem.
export const MOD_CATEGORIES: Array<{ slug: string; label: string; short: string }> = [
  { slug: 'interface',    label: 'Interface e qualidade de vida', short: 'Interface' },
  { slug: 'visual',       label: 'Visual e texturas',             short: 'Visual' },
  { slug: 'itens',        label: 'Itens, roupas e armas',         short: 'Itens' },
  { slug: 'jogabilidade', label: 'Jogabilidade e balanceamento',  short: 'Jogabilidade' },
  { slug: 'mapas',        label: 'Mapas e veículos',              short: 'Mapas e veículos' },
  { slug: 'traducao',     label: 'Tradução',                      short: 'Tradução' },
  { slug: 'audio',        label: 'Áudio',                         short: 'Áudio' },
  { slug: 'bibliotecas',  label: 'Bibliotecas',                   short: 'Bibliotecas' },
  { slug: 'diversao',     label: 'Diversão e cultura pop',        short: 'Diversão' },
  { slug: 'outros',       label: 'Outros',                        short: 'Outros' },
];
const CATEGORY_ORDER = new Map(MOD_CATEGORIES.map((c, i) => [c.slug, i]));

export function categoryLabel(slug: string, short = false): string {
  const c = MOD_CATEGORIES.find(x => x.slug === slug);
  return c ? (short ? c.short : c.label) : slug;
}

/** Item sem atualização na Oficina há mais que isso ganha o aviso "pode não funcionar". */
export const STALE_DAYS = 183;

/** Itens adicionados há menos que isso ganham o selo "Novo". */
export const NEW_DAYS = 14;

// Aceita ".../filedetails/?id=123", ".../filedetails/123" e o número sozinho.
export function workshopIdFrom(text: string): string | null {
  const t = text.trim();
  const m = t.match(/[?&]id=(\d{5,})/) ?? t.match(/\/filedetails\/(\d{5,})/);
  if (m) return m[1];
  return /^\d{6,}$/.test(t) ? t : null;
}

/** Minúsculas, sem acento e com espaços simples. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Para ordenar e para a barra A–Z, ignora prefixos de versão que muitos autores põem
// no começo do nome: "[B42.20] Detailed…", "42.20 | Every Texture…", "(B42) …".
export function nameSortKey(name: string): string {
  let s = normalize(name);
  for (let i = 0; i < 4; i++) {
    const next = s
      .replace(/^[[(][^\])]*[\])]\s*/, '')
      .replace(/^b?\d+(\.\d+)*\s*[|:\-–]\s*/, '')
      .replace(/^[^a-z0-9]+/, '');
    if (next === s) break;
    s = next;
  }
  return s || normalize(name);
}

function letterOf(sortKey: string): string {
  const c = sortKey.charAt(0);
  return c >= 'a' && c <= 'z' ? c.toUpperCase() : '#';
}

function statusOf(mods: Mod[]): ModGroupStatus {
  if (mods.every(m => m.status === 'active'))  return 'allowed';
  if (mods.every(m => m.status === 'blocked')) return 'blocked';
  return 'mixed';
}

// Um mesmo item da Oficina pode empacotar mais de um mod (mod_id diferente, cada um
// com seu próprio status). Agrupa por item para mostrar uma linha por item.
export function groupMods(list: Mod[]): ModGroup[] {
  const map   = new Map<string, Mod[]>();
  const order: string[] = [];
  for (const m of list) {
    const wid = m.workshop_id ?? workshopIdFrom(m.workshop_url ?? '');
    const key = wid ? `w-${wid}` : `m-${m.id}`;
    if (!map.has(key)) { map.set(key, []); order.push(key); }
    map.get(key)!.push(m);
  }
  return order.map(key => {
    const mods    = map.get(key)!;
    const primary = mods[0];
    const sortKey = nameSortKey(primary.name);
    const times   = mods.map(m => Date.parse(m.created_at)).filter(n => !Number.isNaN(n));
    const cats    = new Set(mods.flatMap(m => m.categories ?? []));
    const real    = [...cats].filter(c => c !== 'outros');
    const categories = (real.length ? real : ['outros'])
      .sort((a, b) => (CATEGORY_ORDER.get(a) ?? 99) - (CATEGORY_ORDER.get(b) ?? 99));
    const subs    = mods.map(m => m.subscriptions).filter((n): n is number => typeof n === 'number');
    const updated = mods.map(m => (m.steam_updated_at ? Date.parse(m.steam_updated_at) : NaN)).filter(n => !Number.isNaN(n));
    return {
      key, mods, primary,
      workshopId: key.startsWith('w-') ? key.slice(2) : null,
      status:     statusOf(mods),
      required:   mods.some(m => m.is_required),
      addedAt:    times.length ? Math.min(...times) : 0,
      sortKey,
      letter:     letterOf(sortKey),
      categories,
      subscriptions:  subs.length ? Math.max(...subs) : null,
      steamUpdatedAt: updated.length ? Math.max(...updated) : 0,
      players:        null,
    };
  });
}

/**
 * Busca única: nome, ID do mod (EURY_CRAFTING) ou link/número da Oficina.
 * Ignora acento, maiúscula, espaço, "_" e "-" (então "eury crafting" acha EURY_CRAFTING).
 */
export function matchesQuery(group: ModGroup, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const wid = workshopIdFrom(q);
  if (wid) return group.workshopId === wid;
  const loose = (s: string) => normalize(s).replace(/[\s_\-.]+/g, '');
  const nq = normalize(q);
  const lq = loose(q);
  if (!lq) return true;
  const haystacks = [group.primary.name, ...group.mods.map(m => m.mod_id ?? '')];
  return haystacks.some(h => normalize(h).includes(nq) || loose(h).includes(lq));
}

export function sortGroups(list: ModGroup[], sort: ModSort): ModGroup[] {
  const byName = (a: ModGroup, b: ModGroup) => a.sortKey.localeCompare(b.sortKey, 'pt-BR');
  const cmp = sort === 'recent'
    ? (a: ModGroup, b: ModGroup) => (b.addedAt - a.addedAt) || byName(a, b)
    : sort === 'used'
      ? (a: ModGroup, b: ModGroup) => ((b.players ?? -1) - (a.players ?? -1)) || byName(a, b)
      : byName;
  return [...list].sort(cmp);
}

/** Preenche `players` de cada grupo com o uso agregado de /mods/usage. */
export function applyUsage(groups: ModGroup[], usage: ModUsageResponse | null): ModGroup[] {
  if (!usage) return groups;
  const byWorkshop = new Map<string, number>();
  const byModId    = new Map<string, number>();
  for (const it of usage.items) {
    if (it.workshop_id) byWorkshop.set(it.workshop_id, it.players);
    for (const id of it.mod_ids) byModId.set(id, it.players);
  }
  return groups.map(g => {
    let players = g.workshopId ? byWorkshop.get(g.workshopId) : undefined;
    if (players === undefined) {
      const hits = g.mods.map(m => (m.mod_id ? byModId.get(m.mod_id) : undefined)).filter((n): n is number => n !== undefined);
      players = hits.length ? Math.max(...hits) : 0;
    }
    return { ...g, players };
  });
}

/** Quantos itens de cada categoria há na lista (um item conta em cada categoria que tem). */
export function countByCategory(list: ModGroup[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const g of list) for (const c of g.categories) out.set(c, (out.get(c) ?? 0) + 1);
  return out;
}

export function isStaleGroup(group: ModGroup, now: number = Date.now()): boolean {
  return group.steamUpdatedAt > 0 && now - group.steamUpdatedAt > STALE_DAYS * 86_400_000;
}

/** Meses inteiros desde a última atualização na Oficina. */
export function monthsSinceUpdate(group: ModGroup, now: number = Date.now()): number {
  return group.steamUpdatedAt > 0 ? Math.floor((now - group.steamUpdatedAt) / (30.44 * 86_400_000)) : 0;
}

/** 950 → "950", 2100 → "2,1 mil", 1_250_000 → "1,3 mi". */
export function fmtCount(n: number): string {
  const one = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: v < 10 ? 1 : 0 });
  if (n >= 1_000_000) return `${one(n / 1_000_000)} mi`;
  if (n >= 1_000)     return `${one(n / 1_000)} mil`;
  return String(n);
}

export function isNewGroup(group: ModGroup, now: number = Date.now()): boolean {
  return group.addedAt > 0 && now - group.addedAt < NEW_DAYS * 86_400_000;
}

// ── "Conferir minha lista" (v4.35.0) ─────────────────────────────────────────
// O jogador cola o mods.txt do save (linhas "mod = X,") ou uma lista de IDs e vê, antes
// de jogar, o que o servidor vai achar: a regra é a de backend/src/routes/sync.ts —
// ID exato (maiúscula conta); bloqueado ou fora do cadastro desclassifica.
// Tudo roda no navegador, com a lista já carregada: nada é enviado ao servidor.

/** IDs que o jogo sempre tem ativos e o mod do rank não envia (RankModCheck.lua, INTERNAL_IDS). */
const INTERNAL_MOD_IDS = new Set(['base', 'Base', 'pzexo']);

export interface ModCheckHit { id: string; group: ModGroup }

export interface ModCheckResult {
  total:           number;
  allowed:         ModCheckHit[];
  blocked:         ModCheckHit[];
  /** Fora do cadastro. `suggestion` = ID cadastrado igual, mas com maiúsculas diferentes. */
  unlisted:        Array<{ id: string; suggestion: string | null }>;
  /** Itens obrigatórios com algum ID obrigatório fora da lista (todos são exigidos, v4.36.0). */
  requiredMissing: Array<{ group: ModGroup; ids: string[] }>;
  /** Números da Oficina colados no lugar do ID do mod. */
  workshopNumbers: string[];
}

export function parseModListText(text: string): string[] {
  const fromModsTxt = [...text.matchAll(/^\s*mod\s*=\s*(.+?)\s*,?\s*$/gim)].map(m => m[1]);
  const raw = fromModsTxt.length > 0 ? fromModsTxt : text.split(/[\n,;]+/);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    // B42 pode prefixar "\" no ID; aspas e vírgula final vêm de colagens de outras fontes
    const id = r.trim().replace(/^\+/, '').replace(/^["']|["']$/g, '').replace(/,$/, '').trim();
    if (!id || INTERNAL_MOD_IDS.has(id) || /^(VERSION|mods|maps|[{}])/.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function checkModList(text: string, groups: ModGroup[]): ModCheckResult {
  const ids = parseModListText(text);
  const byId    = new Map<string, { group: ModGroup; status: string }>();
  const byLower = new Map<string, string>();
  for (const g of groups) {
    for (const m of g.mods) {
      if (!m.mod_id) continue;
      byId.set(m.mod_id, { group: g, status: m.status });
      byLower.set(m.mod_id.toLowerCase(), m.mod_id);
    }
  }
  const res: ModCheckResult = { total: 0, allowed: [], blocked: [], unlisted: [], requiredMissing: [], workshopNumbers: [] };
  const present = new Set<string>();
  for (const id of ids) {
    if (/^\d{6,}$/.test(id)) { res.workshopNumbers.push(id); continue; }
    res.total++;
    const hit = byId.get(id);
    if (!hit) {
      const s = byLower.get(id.toLowerCase());
      res.unlisted.push({ id, suggestion: s && s !== id ? s : null });
      continue;
    }
    present.add(id);
    (hit.status === 'blocked' ? res.blocked : res.allowed).push({ id, group: hit.group });
  }
  for (const g of groups) {
    const missing = g.mods
      .filter(m => m.mod_id && m.is_required && m.status === 'active' && !present.has(m.mod_id))
      .map(m => m.mod_id!);
    if (missing.length > 0) res.requiredMissing.push({ group: g, ids: missing });
  }
  return res;
}

/**
 * Endereço da lista já filtrada por um ID de mod (links "Ver na lista"). Sem aba: a página
 * abre na aba do item que tem esse ID exato (um ID bloqueado pode estar num item parcial).
 */
export function modListUrl(modId: string): string {
  return `/mods-lista?${new URLSearchParams({ q: modId }).toString()}`;
}

/** Aba do item que tem exatamente este mod_id, ou null. */
export function tabForExactModId(groups: ModGroup[], query: string): ModGroupStatus | null {
  const q = query.trim();
  if (!q) return null;
  return groups.find(g => g.mods.some(m => m.mod_id === q))?.status ?? null;
}

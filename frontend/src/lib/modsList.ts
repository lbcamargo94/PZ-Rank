// Lógica da página pública "Mods do Campeonato" (/mods-lista), separada da tela
// para ser testável: agrupamento por item da Oficina, busca e ordenação.
import type { Mod } from '../types';

export type ModGroupStatus = 'allowed' | 'blocked' | 'mixed';
export type ModSort = 'az' | 'recent';

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
}

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
    return {
      key, mods, primary,
      workshopId: key.startsWith('w-') ? key.slice(2) : null,
      status:     statusOf(mods),
      required:   mods.some(m => m.is_required),
      addedAt:    times.length ? Math.min(...times) : 0,
      sortKey,
      letter:     letterOf(sortKey),
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
  return [...list].sort(sort === 'recent' ? (a, b) => (b.addedAt - a.addedAt) || byName(a, b) : byName);
}

export function isNewGroup(group: ModGroup, now: number = Date.now()): boolean {
  return group.addedAt > 0 && now - group.addedAt < NEW_DAYS * 86_400_000;
}

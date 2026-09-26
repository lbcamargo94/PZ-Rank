// Abates por arma (mod 2.29.0+). O mod grava no arquivo de stats, junto dos
// contadores de ações (e portanto assinado pelo Companion):
//   wk_<tipo> = abates por tipo de arma (WeaponCategory do B42 + firearm/other)
//   wt:<item> = as 5 armas (fullType, ex. Base.Axe) que mais mataram na run
// A arma do ÚLTIMO golpe leva o abate; morto pelo jogador sem golpe registrado
// (atropelado, fogo, empurrão) = "other". Guardado em entries.weapon_kills (JSON).

export const WEAPON_KILL_CATS = [
  'axe', 'spear', 'longblade', 'smallblade', 'blunt', 'smallblunt',
  'firearm', 'unarmed', 'improvised', 'other',
] as const;
export type WeaponKillCat = typeof WEAPON_KILL_CATS[number];

export interface WeaponKills {
  cats: Partial<Record<WeaponKillCat, number>>;
  top:  Array<[string, number]>;   // [fullType, abates], maior → menor
}

/** Versão do mod a partir da qual as armas são registradas (texto da página). */
export const WEAPON_KILLS_MIN_MOD_VERSION = '2.29.0';

const MAX_KILLS = 10_000_000;
const ITEM_RE   = /^[A-Za-z0-9_]{1,40}\.[A-Za-z0-9_]{1,80}$/;
const CATS      = new Set<string>(WEAPON_KILL_CATS);

const okCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= MAX_KILLS;

/** Extrai wk_/wt: do objeto stats do Companion. null = nada de arma (mod antigo). */
export function parseWeaponStats(raw: Record<string, unknown>): WeaponKills | null {
  const cats: WeaponKills['cats'] = {};
  const top: WeaponKills['top'] = [];
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('wk_')) {
      const cat = k.slice(3);
      if (CATS.has(cat) && okCount(v)) cats[cat as WeaponKillCat] = v;
    } else if (k.startsWith('wt:')) {
      const item = k.slice(3);
      if (ITEM_RE.test(item) && okCount(v)) top.push([item, v]);
    }
  }
  if (Object.keys(cats).length === 0 && top.length === 0) return null;
  top.sort((a, b) => b[1] - a[1]);
  return { cats, top: top.slice(0, 5) };
}

/** Lê a coluna weapon_kills (TEXT JSON) de forma tolerante. */
export function readWeaponKills(v: unknown): WeaponKills | null {
  let o: unknown = v;
  if (typeof v === 'string') { try { o = JSON.parse(v); } catch { return null; } }
  if (!o || typeof o !== 'object') return null;
  const w = o as Partial<WeaponKills>;
  const cats: WeaponKills['cats'] = {};
  for (const [k, n] of Object.entries(w.cats ?? {})) if (CATS.has(k) && okCount(n)) cats[k as WeaponKillCat] = n;
  const top = Array.isArray(w.top)
    ? w.top.filter((t): t is [string, number] => Array.isArray(t) && typeof t[0] === 'string' && ITEM_RE.test(t[0]) && okCount(t[1])).slice(0, 5)
    : [];
  return { cats, top };
}

export function totalWeaponKills(w: WeaponKills): number {
  return Object.values(w.cats).reduce((s, n) => s + (n ?? 0), 0);
}

/** Tipo preferido = mais abates, ignorando "other" (não é arma). */
export function favoriteCategory(w: WeaponKills): WeaponKillCat | null {
  let best: WeaponKillCat | null = null;
  let bestN = 0;
  for (const cat of WEAPON_KILL_CATS) {
    if (cat === 'other') continue;
    const n = w.cats[cat] ?? 0;
    if (n > bestN) { best = cat; bestN = n; }
  }
  return best;
}

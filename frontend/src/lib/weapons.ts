// Abates por arma (mod 2.29.0+) — espelho de backend/src/lib/weapons.ts.
// entries.weapon_kills = JSON {cats:{tipo:n}, top:[[item,n]]}; a arma do último golpe leva o abate.
import { WEAPON_NAMES } from './weaponNames';

export interface WeaponKills {
  cats: Record<string, number>;
  top:  Array<[string, number]>;
}

// Tipos de arma do B42 (WeaponCategory) + arma de fogo + "outros"
export const WEAPON_CATEGORIES: Record<string, { label: string; icon: string }> = {
  axe:        { label: 'Machado',            icon: '🪓' },
  spear:      { label: 'Lança',              icon: '🔱' },
  longblade:  { label: 'Lâmina longa',       icon: '⚔️' },
  smallblade: { label: 'Lâmina curta',       icon: '🔪' },
  blunt:      { label: 'Contundente longo',  icon: '🏏' },
  smallblunt: { label: 'Contundente curto',  icon: '🔨' },
  firearm:    { label: 'Arma de fogo',       icon: '🔫' },
  unarmed:    { label: 'Desarmado',          icon: '👊' },
  improvised: { label: 'Improvisada',        icon: '🪛' },
  other:      { label: 'Outros',             icon: '🚗' },
};

export const OTHER_HINT = 'Outros = zumbis mortos sem golpe de arma registrado (atropelados, fogo, empurrões).';

export function categoryLabel(cat: string): string {
  return WEAPON_CATEGORIES[cat]?.label ?? cat;
}
export function categoryIcon(cat: string): string {
  return WEAPON_CATEGORIES[cat]?.icon ?? '⚔️';
}

/** Nome em pt-BR do item (tabela gerada dos arquivos do jogo); sem nome → parte após o ponto. */
export function weaponName(id: string): string {
  return WEAPON_NAMES[id] ?? id.split('.').pop() ?? id;
}

export function parseWeaponKills(v: unknown): WeaponKills | null {
  let o: unknown = v;
  if (typeof v === 'string') { try { o = JSON.parse(v); } catch { return null; } }
  if (!o || typeof o !== 'object') return null;
  const w = o as Partial<WeaponKills>;
  const cats: Record<string, number> = {};
  for (const [k, n] of Object.entries(w.cats ?? {})) if (typeof n === 'number' && n > 0) cats[k] = n;
  const top = Array.isArray(w.top)
    ? w.top.filter((t): t is [string, number] => Array.isArray(t) && typeof t[0] === 'string' && typeof t[1] === 'number' && t[1] > 0)
    : [];
  if (Object.keys(cats).length === 0 && top.length === 0) return null;
  return { cats, top };
}

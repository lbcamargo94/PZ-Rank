// Categorias da página pública de mods (/mods-lista), v4.34.0.
//
// A Steam devolve as tags que o autor marcou no item da Oficina (GetPublishedFileDetails),
// mas elas são genéricas e repetidas ("Interface" em 86 de 151 itens). Aqui elas são
// agrupadas em 9 categorias do site. Um item pode cair em mais de uma. O moderador pode
// substituir a lista de um item pelo painel (workshop_items.categories).

export interface ModCategory {
  slug:  string;
  label: string;
  tags:  string[];
}

export const MOD_CATEGORIES: ModCategory[] = [
  { slug: 'interface',   label: 'Interface e qualidade de vida', tags: ['Interface', 'QOL'] },
  { slug: 'visual',      label: 'Visual e texturas',             tags: ['Textures', 'Models'] },
  { slug: 'itens',       label: 'Itens, roupas e armas',         tags: ['Items', 'Clothing/Armor', 'Weapons', 'Military', 'Food'] },
  { slug: 'jogabilidade', label: 'Jogabilidade e balanceamento', tags: ['Balance', 'Realistic', 'Hardmode', 'Skills', 'Traits', 'Farming', 'Animals', 'building'] },
  { slug: 'mapas',       label: 'Mapas e veículos',              tags: ['Map', 'Vehicles'] },
  { slug: 'traducao',    label: 'Tradução',                      tags: ['Language/Translation'] },
  { slug: 'audio',       label: 'Áudio',                         tags: ['Audio'] },
  { slug: 'bibliotecas', label: 'Bibliotecas',                   tags: ['Framework'] },
  { slug: 'diversao',    label: 'Diversão e cultura pop',        tags: ['Silly/Fun', 'Pop Culture', 'Literature'] },
];

/** Item sem nenhuma tag útil, até o moderador classificar. */
export const OTHER_CATEGORY = 'outros';

const VALID = new Set([...MOD_CATEGORIES.map(c => c.slug), OTHER_CATEGORY]);
const BY_TAG = new Map<string, string>();
for (const c of MOD_CATEGORIES) for (const t of c.tags) BY_TAG.set(t.toLowerCase(), c.slug);

export function categoriesFromTags(tags: string[]): string[] {
  const out = new Set<string>();
  for (const t of tags) {
    const slug = BY_TAG.get(t.trim().toLowerCase());
    if (slug) out.add(slug);
  }
  // Mantém a ordem da lista de categorias, não a ordem das tags
  const sorted = MOD_CATEGORIES.map(c => c.slug).filter(s => out.has(s));
  return sorted.length ? sorted : [OTHER_CATEGORY];
}

/** Valida a lista enviada pelo moderador. Retorna null se vier vazia ou só com valores inválidos. */
export function cleanCategoryOverride(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const set = new Set(raw.filter((s): s is string => typeof s === 'string' && VALID.has(s)));
  const sorted = [...MOD_CATEGORIES.map(c => c.slug), OTHER_CATEGORY].filter(s => set.has(s));
  return sorted.length ? sorted : null;
}

/** Texto JSON guardado no banco ("[\"interface\"]") → lista. Tolera NULL e lixo. */
export function parseStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === 'string');
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
  } catch { return []; }
}

/** Categoria final do item: a do moderador, se houver; senão a calculada pelas tags. */
export function resolveCategories(tagsRaw: unknown, overrideRaw: unknown): string[] {
  const override = cleanCategoryOverride(parseStringList(overrideRaw));
  return override ?? categoriesFromTags(parseStringList(tagsRaw));
}

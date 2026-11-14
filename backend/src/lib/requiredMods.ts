// Mods obrigatórios do campeonato (v4.36.0). Regra: TODO mod_id cadastrado como obrigatório
// e permitido precisa estar ativo no save; faltar qualquer um desclassifica (reversível,
// como os outros motivos de mod: volta a valer no primeiro sync com a lista certa).
//
// Até a v2.35.0 o mod do rank não enviava o próprio PZCommunityRank (RankModCheck.lua), então
// lista vazia podia ser "só o mod do rank". A partir da v2.36.0 ele vai na lista e a coleta usa
// getActivatedMods(): lista vazia vira "sem os obrigatórios" (EMPTY_LIST_TRUSTED_FROM). O
// PZCommunityRank nunca conta como ausente: com código, ele está rodando.
export const INTERNAL_MOD_IDS = new Set(['base', 'Base', 'pzexo', 'PZCommunityRank']);

export interface RequiredCatalogMod {
  mod_id:      string | null;
  status:      string;
  is_required: boolean | number | null;
}

const truthy = (v: unknown) => v === true || v === 1 || v === '1' || v === 't';

/** Versão do mod a partir da qual a lista de mods vazia é confiável (v2.36.0). */
export const EMPTY_LIST_TRUSTED_FROM = '2.36.0';

/**
 * IDs obrigatórios que faltam em `activeMods`. Lista vazia só é avaliada com `trustEmpty`
 * (mod v2.36.0+); antes disso não dá para saber se a coleta falhou.
 */
export function missingRequiredMods(catalog: RequiredCatalogMod[], activeMods: string[], trustEmpty = false): string[] {
  if (activeMods.length === 0 && !trustEmpty) return [];
  const active = new Set(activeMods);
  const out: string[] = [];
  for (const m of catalog) {
    if (!m.mod_id || m.status !== 'active' || !truthy(m.is_required)) continue;
    if (INTERNAL_MOD_IDS.has(m.mod_id) || active.has(m.mod_id)) continue;
    if (!out.includes(m.mod_id)) out.push(m.mod_id);
  }
  return out;
}

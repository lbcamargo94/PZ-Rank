// Mods obrigatórios do campeonato (v4.36.0). Regra: TODO mod_id cadastrado como obrigatório
// e permitido precisa estar ativo no save; faltar qualquer um desclassifica (reversível,
// como os outros motivos de mod: volta a valer no primeiro sync com a lista certa).
//
// O mod do rank não envia os IDs internos (RankModCheck.lua, INTERNAL_IDS) — o próprio
// PZCommunityRank está sempre ativo quando há código, então nunca conta como ausente.
export const INTERNAL_MOD_IDS = new Set(['base', 'Base', 'pzexo', 'PZCommunityRank']);

export interface RequiredCatalogMod {
  mod_id:      string | null;
  status:      string;
  is_required: boolean | number | null;
}

const truthy = (v: unknown) => v === true || v === 1 || v === '1' || v === 't';

/** IDs obrigatórios que faltam em `activeMods`. Lista vazia de mods = não dá para avaliar. */
export function missingRequiredMods(catalog: RequiredCatalogMod[], activeMods: string[]): string[] {
  if (activeMods.length === 0) return [];
  const active = new Set(activeMods);
  const out: string[] = [];
  for (const m of catalog) {
    if (!m.mod_id || m.status !== 'active' || !truthy(m.is_required)) continue;
    if (INTERNAL_MOD_IDS.has(m.mod_id) || active.has(m.mod_id)) continue;
    if (!out.includes(m.mod_id)) out.push(m.mod_id);
  }
  return out;
}

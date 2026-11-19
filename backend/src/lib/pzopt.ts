// PZ Optimization (Project Zomboid Optimizer, PZO). O mod do rank detecta o PZO instalado na pasta
// do jogo e envia "pzopt=1" (mod v2.35.0+). Desde a v4.39.0 o servidor só desclassifica quando o PZO
// NÃO está permitido na lista de mods do site: a moderação decide pelo status do cadastro.
// O PZO roda pela pasta do jogo e quase nunca aparece na lista de mods ativos, então o cadastro é
// localizado pelo mod_id ou pelo ID da Oficina conhecidos, não pelos mods ativos do jogador.
export const PZOPT_MOD_IDS = new Set(['PZ_Optimization', 'MPOptimizer']);
export const PZOPT_WORKSHOP_IDS = new Set(['3805285544', '3787481250']);

export interface PzoptCatalogMod {
  mod_id:       string | null;
  workshop_id?: string | number | null;
  status:       string;
}

const isPzoptRow = (m: PzoptCatalogMod) =>
  (m.mod_id != null && PZOPT_MOD_IDS.has(m.mod_id))
  || (m.workshop_id != null && PZOPT_WORKSHOP_IDS.has(String(m.workshop_id)));

/**
 * true quando o PZO está cadastrado como permitido (status "active") e nenhum cadastro dele está
 * bloqueado. Sem cadastro, ou com qualquer cadastro bloqueado, continua proibido.
 */
export function isPzoptPermitted(catalog: PzoptCatalogMod[]): boolean {
  const rows = catalog.filter(isPzoptRow);
  if (rows.length === 0) return false;
  if (rows.some(m => m.status === 'blocked')) return false;
  return rows.some(m => m.status === 'active');
}

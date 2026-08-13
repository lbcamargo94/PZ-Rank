export interface BaseObjectives {
  has_base: boolean;
  bed:      boolean;
  windows:  boolean;
  sink:     boolean;
  power:    boolean;
  food:     boolean;
  vehicle:  boolean;
  arsenal:  boolean;
}

export interface Objectives {
  bases:         Record<string, BaseObjectives>;
  military_base: boolean;
  spiffo_hq:     boolean;
  spiffo_relic:  boolean;
}

export const SPIFFOS_RESTAURANTS = [
  { id: 'riverside',       name: 'Riverside'                      },
  { id: 'rosewood',        name: 'Rosewood'                       },
  { id: 'irvington',       name: 'Irvington'                      },
  { id: 'ekron',           name: 'Irvington – Autódromo'          },
  { id: 'muldraugh',       name: 'Muldraugh'                      },
  { id: 'muldraugh_cross', name: 'Muldraugh – Cruzamento'         },
  { id: 'west_point',      name: 'West Point'                     },
  { id: 'louisville_w',    name: 'Louisville – Entrada'           },
  { id: 'louisville_hq',   name: 'Louisville – Principal'         },
  { id: 'louisville_e',    name: 'Louisville – Distrito Oriental'  },
  { id: 'louisville_c',    name: 'Louisville – Distrito Comercial' },
  { id: 'brandenburg',     name: 'Brandenburg'                    },
] as const;

export const OFFICIAL_BASE_IDS: Set<string> = new Set(SPIFFOS_RESTAURANTS.map(r => r.id));

export const BASE_ITEMS: { id: keyof Omit<BaseObjectives, 'has_base'>; label: string }[] = [
  { id: 'bed',     label: 'Cama de boa qualidade'                          },
  { id: 'windows', label: 'Todas as janelas barricadas no nível máximo'    },
  { id: 'sink',    label: 'Pia com água encanada e funcional'              },
  { id: 'power',   label: 'Energia elétrica (gerador)'                    },
  { id: 'food',    label: '12.500 cal. em alimentos não perecíveis'       },
  { id: 'vehicle', label: 'Veículo funcional e abastecido'                 },
  { id: 'arsenal', label: '20 armas + 10 ferramentas produzidas pelo jogador' },
];

const EMPTY_BASE: BaseObjectives = {
  has_base: false, bed: false, windows: false,
  sink: false, power: false, food: false, vehicle: false, arsenal: false,
};

export function initObjectives(): Objectives {
  const bases: Record<string, BaseObjectives> = {};
  for (const r of SPIFFOS_RESTAURANTS) bases[r.id] = { ...EMPTY_BASE };
  return { bases, military_base: false, spiffo_hq: false, spiffo_relic: false };
}

/** Mescla objetivos existentes com o template fresco:
 *  - mantém dados das bases oficiais atuais
 *  - descarta bases obsoletas (ex: march_ridge, valley_station)
 *  - adiciona bases novas ausentes (ex: muldraugh_cross) */
export function mergeObjectives(existing: Objectives | null | undefined): Objectives {
  const fresh = initObjectives();
  if (!existing) return fresh;
  const bases: Record<string, BaseObjectives> = { ...fresh.bases };
  for (const id of Object.keys(bases)) {
    if (existing.bases?.[id]) bases[id] = existing.bases[id];
  }
  return {
    bases,
    military_base: existing.military_base ?? false,
    spiffo_hq:     existing.spiffo_hq     ?? false,
    spiffo_relic:  existing.spiffo_relic  ?? false,
  };
}

// ── Pontuação ───────────────────────────────────────────────
export const SCORE_KILLS_PER_KILL = 0.1;      // pts por zumbi abatido
export const SCORE_KILLS_MAX      = 800_000;  // máximo de kills contabilizados
export const SCORE_SKILL_10       = 1_000;    // pts por habilidade nível 10
export const SCORE_SPIFFO_DONE    = 1_000;    // pts por Spiffo's com base estabelecida
export const SCORE_MILITARY       = 5_000;    // pts por base militar conquistada
export const SCORE_SPIFFO_HQ      = 5_000;    // pts por Sede do Spiffo's conquistada
export const SCORE_SPIFFO_RELIC   = 3_000;    // pts pela Relíquia do Spiffo

const N_SKILLS = 35; // habilidades do jogo

export const MAX_POSSIBLE_SCORE =
  Math.round(SCORE_KILLS_MAX * SCORE_KILLS_PER_KILL) +
  N_SKILLS * SCORE_SKILL_10 +
  SPIFFOS_RESTAURANTS.length * SCORE_SPIFFO_DONE +
  SCORE_MILITARY +
  SCORE_SPIFFO_HQ +
  SCORE_SPIFFO_RELIC;

/** Conta skills no nível 10 a partir da string da coluna `skills` do banco.
 *  Formato: "Machado 10, Força 8, Vigilância 10, ..." */
export function countSkills10(skillsStr: string | null | undefined): number {
  if (!skillsStr) return 0;
  let count = 0;
  for (const part of skillsStr.split(',')) {
    const t = part.trim();
    const lastSpace = t.lastIndexOf(' ');
    if (lastSpace >= 0 && t.slice(lastSpace + 1) === '10') count++;
  }
  return count;
}

export function computeScore(
  kills:         number,
  skills10Count: number,
  objectives?:   Partial<Objectives> | null,
): number {
  let score = Math.round(Math.min(kills, SCORE_KILLS_MAX) * SCORE_KILLS_PER_KILL);

  score += skills10Count * SCORE_SKILL_10;

  if (objectives?.bases) {
    for (const [id, base] of Object.entries(objectives.bases)) {
      if (OFFICIAL_BASE_IDS.has(id) && base.has_base) score += SCORE_SPIFFO_DONE;
    }
  }
  if (objectives?.military_base) score += SCORE_MILITARY;
  if (objectives?.spiffo_hq)     score += SCORE_SPIFFO_HQ;
  if (objectives?.spiffo_relic)  score += SCORE_SPIFFO_RELIC;

  return score;
}

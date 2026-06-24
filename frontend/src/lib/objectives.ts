export interface BaseObjectives {
  has_base: boolean;
  bed:      boolean;
  windows:  boolean;
  sink:     boolean;
  power:    boolean;
  food:     boolean;
  vehicle:  boolean;
}

export interface Objectives {
  bases:          Record<string, BaseObjectives>;
  kills_500k:     boolean;
  all_skills_10:  boolean;
  spiffo_statue:  boolean;
  military_base:  boolean;
}

export const SPIFFOS_RESTAURANTS = [
  { id: 'muldraugh',      name: 'Muldraugh'                      },
  { id: 'west_point',     name: 'West Point'                     },
  { id: 'riverside',      name: 'Riverside'                      },
  { id: 'rosewood',       name: 'Rosewood'                       },
  { id: 'march_ridge',    name: 'March Ridge'                    },
  { id: 'ekron',          name: 'Irvington - Autódromo'          },
  { id: 'valley_station', name: 'Valley Station'                 },
  { id: 'brandenburg',    name: 'Brandenburg'                    },
  { id: 'irvington',      name: 'Irvington'                      },
  { id: 'louisville_w',   name: 'Louisville - Parkwood'          },
  { id: 'louisville_c',   name: 'Louisville - East Market'       },
  { id: 'louisville_e',   name: 'Louisville - Centro'            },
  { id: 'louisville_hq',  name: 'Louisville - Sede (HQ)'        },
] as const;

export const BASE_ITEMS: { id: keyof Omit<BaseObjectives, 'has_base'>; label: string }[] = [
  { id: 'bed',     label: 'Cama de boa qualidade'            },
  { id: 'windows', label: 'Todas as janelas barricadas'      },
  { id: 'sink',    label: 'Pia encanada'                     },
  { id: 'power',   label: 'Energia'                          },
  { id: 'food',    label: '2500 cal. de comida não perecível'},
  { id: 'vehicle', label: 'Um veículo'                       },
];

const EMPTY_BASE: BaseObjectives = {
  has_base: false, bed: false, windows: false,
  sink: false, power: false, food: false, vehicle: false,
};

export function initObjectives(): Objectives {
  const bases: Record<string, BaseObjectives> = {};
  for (const r of SPIFFOS_RESTAURANTS) bases[r.id] = { ...EMPTY_BASE };
  return { bases, kills_500k: false, all_skills_10: false, spiffo_statue: false, military_base: false };
}

// ── Pontuação ───────────────────────────────────────────────
export const SCORE_KILLS       = 1;        // pts por zumbi abatido
export const SCORE_KILLS_MAX   = 500_000;  // máximo de kills contabilizados
export const SCORE_BASE        = 50;  // pts por base estabelecida
export const SCORE_BASE_ITEM   = 10;  // pts por item da base
export const SCORE_KILLS_500K  = 500; // pts por atingir 500k kills
export const SCORE_ALL_SKILLS  = 500; // pts por maxar todas as habilidades
export const SCORE_STATUE      = 300; // pts pela Estátua do Spiffo
export const SCORE_MILITARY    = 300; // pts por limpar a base militar

const BASE_ITEM_COUNT = 6; // bed, windows, sink, power, food, vehicle

export const MAX_POSSIBLE_SCORE =
  SCORE_KILLS_MAX +
  SPIFFOS_RESTAURANTS.length * (SCORE_BASE + BASE_ITEM_COUNT * SCORE_BASE_ITEM) +
  SCORE_KILLS_500K +
  SCORE_ALL_SKILLS +
  SCORE_STATUE +
  SCORE_MILITARY;

export function computeScore(
  kills: number,
  objectives?: Partial<Objectives> | null,
): number {
  let score = Math.min(kills, SCORE_KILLS_MAX) * SCORE_KILLS;

  if (objectives?.bases) {
    for (const base of Object.values(objectives.bases)) {
      if (!base.has_base) continue;
      score += SCORE_BASE;
      if (base.bed)     score += SCORE_BASE_ITEM;
      if (base.windows) score += SCORE_BASE_ITEM;
      if (base.sink)    score += SCORE_BASE_ITEM;
      if (base.power)   score += SCORE_BASE_ITEM;
      if (base.food)    score += SCORE_BASE_ITEM;
      if (base.vehicle) score += SCORE_BASE_ITEM;
    }
  }
  if (objectives?.kills_500k)    score += SCORE_KILLS_500K;
  if (objectives?.all_skills_10) score += SCORE_ALL_SKILLS;
  if (objectives?.spiffo_statue) score += SCORE_STATUE;
  if (objectives?.military_base) score += SCORE_MILITARY;

  return score;
}

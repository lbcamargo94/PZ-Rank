export type TraitType = 'positive' | 'negative';

export interface TraitDef {
  name: string;   // PT-BR
  type: TraitType;
  image?: string; // filename (sem .png) dentro de Positivos/ ou Negativos/
}

const _posImgs = import.meta.glob<string>(
  '../../assets/caracteristicas/Positivos/*.png',
  { eager: true, query: '?url', import: 'default' },
);
const _negImgs = import.meta.glob<string>(
  '../../assets/caracteristicas/Negativos/*.png',
  { eager: true, query: '?url', import: 'default' },
);

export function getTraitImageUrl(def: TraitDef): string | undefined {
  if (!def.image) return undefined;
  const folder = def.type === 'positive' ? 'Positivos' : 'Negativos';
  const map    = def.type === 'positive' ? _posImgs : _negImgs;
  return map[`../../assets/caracteristicas/${folder}/${def.image}.png`];
}

export const TRAITS: Record<string, TraitDef> = {
  // ── Físicos positivos ──────────────────────────────────────
  Athletic:         { name: 'Atlético',               type: 'positive', image: 'Atlético'            },
  Fit:              { name: 'Em Forma',                type: 'positive', image: 'Em forma'             },
  Strong:           { name: 'Forte',                   type: 'positive', image: 'Forte'                },
  Stout:            { name: 'Robusto',                 type: 'positive', image: 'Musculoso'            },
  Graceful:         { name: 'Gracioso',                type: 'positive', image: 'Gracioso'             },
  LightFooted:      { name: 'Passos Silenciosos',      type: 'positive'                                },
  NimbleFingers:    { name: 'Dedos Ágeis',             type: 'positive', image: 'Mãos ágeis'          },
  Dextrous:         { name: 'Destreza',                type: 'positive'                                },
  ThickSkinned:     { name: 'Pele Grossa',             type: 'positive', image: 'Casca grossa'        },
  Resilient:        { name: 'Resiliente',              type: 'positive', image: 'Saudável'             },
  Wakeful:          { name: 'Vigilante',               type: 'positive', image: 'Madrugador'          },
  VeryUnderweight:  { name: 'Muito Magro',             type: 'positive'                                },

  // ── Sensoriais positivos ───────────────────────────────────
  KeenHearing:      { name: 'Audição Aguçada',         type: 'positive', image: 'Audição aguçada'     },
  EagleEyed:        { name: 'Olho de Águia',           type: 'positive', image: 'Visão aguçada'       },

  // ── Mentais / passivos positivos ───────────────────────────
  Brave:            { name: 'Corajoso',                type: 'positive', image: 'Corajoso'             },
  Organized:        { name: 'Organizado',              type: 'positive', image: 'Organizado'           },
  Lucky:            { name: 'Sortudo',                 type: 'positive', image: 'Sortudo'              },
  FastLearner:      { name: 'Aprendiz Rápido',         type: 'positive', image: 'Aprendiz rápido'     },
  FastReader:       { name: 'Leitor Rápido',           type: 'positive', image: 'Leitura dinâmica'    },
  Handy:            { name: 'Habilidoso',              type: 'positive'                                },
  Outdoorsman:      { name: 'Sobrevivencialista',      type: 'positive', image: 'Andarilho'           },
  SpeedDemon:       { name: 'Demônio da Velocidade',   type: 'positive', image: 'Bom de volante'      },
  FirstAider:       { name: 'Primeiros Socorros',      type: 'positive'                                },
  BornSurvivor:     { name: 'Sobrevivente Nato',       type: 'positive'                                },
  CatEyes:          { name: 'Olhos de Gato',           type: 'positive', image: 'Olhos de gato'       },
  Marksman:         { name: 'Atirador de Elite',       type: 'positive'                                },
  Hunter:           { name: 'Caçador',                 type: 'positive'                                },
  Herbalist:        { name: 'Herbalista',              type: 'positive'                                },
  Inconspicuous:    { name: 'Discreto',                type: 'positive', image: 'Discreto'             },
  IronGut:          { name: 'Estômago de Ferro',       type: 'positive', image: 'Estômago de ferro'   },
  Wakeful2:         { name: 'Leve Sono',               type: 'positive'                                },
  Desensitized:     { name: 'Dessensibilizado',        type: 'positive', image: 'Viciado em adrenalina' },
  Construction:     { name: 'Construção',              type: 'positive'                                },

  // ── Físicos negativos ─────────────────────────────────────
  Weak:             { name: 'Fraco',                   type: 'negative', image: 'Fracote'             },
  Unfit:            { name: 'Sem Condicionamento',     type: 'negative', image: 'Despreparado'        },
  Obese:            { name: 'Obeso',                   type: 'negative', image: 'Obeso'               },
  Overweight:       { name: 'Acima do Peso',           type: 'negative', image: 'Acima do peso'       },
  OutOfShape:       { name: 'Fora de Forma',           type: 'negative', image: 'Fora de forma'       },
  ThinSkinned:      { name: 'Pele Fina',               type: 'negative', image: 'Pele frágil'         },
  SlowHealer:       { name: 'Cura Lenta',              type: 'negative', image: 'Saúde fraca'         },
  ProneToIllness:   { name: 'Propenso a Doenças',      type: 'negative', image: 'Baixa imunidade'     },
  Smoker:           { name: 'Fumante',                 type: 'negative', image: 'Fumante'              },
  Underweight:      { name: 'Abaixo do Peso',          type: 'negative', image: 'Magrelo'             },

  // ── Sensoriais negativos ──────────────────────────────────
  HardOfHearing:    { name: 'Duro de Ouvido',          type: 'negative', image: 'Ruim de audição'     },
  ShortSighted:     { name: 'Míope',                   type: 'negative', image: 'Míope'               },
  Deaf:             { name: 'Surdo',                   type: 'negative', image: 'Surdo'                },

  // ── Mentais / passivos negativos ──────────────────────────
  Cowardly:         { name: 'Covarde',                 type: 'negative', image: 'Covarde'             },
  Clumsy:           { name: 'Desajeitado',             type: 'negative', image: 'Desajeitado'         },
  SlowReader:       { name: 'Leitor Lento',            type: 'negative', image: 'Semi-analfabeto'     },
  SlowLearner:      { name: 'Aprendiz Lento',          type: 'negative', image: 'Aprendiz lento'      },
  Conspicuous:      { name: 'Chamativo',               type: 'negative', image: 'Estabanado'          },
  HeartyAppetite:   { name: 'Apetite Voraz',           type: 'negative', image: 'Comilão'             },
  PanickedShot:     { name: 'Tiro em Pânico',          type: 'negative'                                },
  Restless:         { name: 'Agitado',                 type: 'negative'                                },
  Sleepyhead:       { name: 'Dorminhoco',              type: 'negative', image: 'Dorminhoco'          },
  Pacifist:         { name: 'Pacifista',               type: 'negative', image: 'Pacifista'           },
  Claustrophobic:   { name: 'Claustrofóbico',          type: 'negative', image: 'Claustrofóbico'      },
  Agoraphobic:      { name: 'Agorafóbico',             type: 'negative', image: 'Agorafóbico'         },
  Hemophobic:       { name: 'Hemofóbico',              type: 'negative', image: 'Hemofóbico'          },
  Illiterate:       { name: 'Analfabeto',              type: 'negative', image: 'Analfabeto'          },
  BetaBlocker:      { name: 'Betabloqueador',          type: 'negative'                                },
  Glasses:          { name: 'Usa Óculos',              type: 'negative'                                },
};

export function resolveTrait(id: string): TraitDef {
  return TRAITS[id] ?? { name: id, type: 'positive' };
}

export function parseTraitList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

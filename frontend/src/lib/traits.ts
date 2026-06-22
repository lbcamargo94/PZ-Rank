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
  Athletic:           { name: 'Atlético',               type: 'positive', image: 'Atlético'               },
  Fit:                { name: 'Em Forma',                type: 'positive', image: 'Em forma'                },
  Strong:             { name: 'Forte',                   type: 'positive', image: 'Forte'                   },
  Stout:              { name: 'Musculoso',               type: 'positive', image: 'Musculoso'               },
  Graceful:           { name: 'Gracioso',                type: 'positive', image: 'Gracioso'                },
  LightFooted:        { name: 'Passos Silenciosos',      type: 'positive'                                    },
  NimbleFingers:      { name: 'Mãos Ágeis',              type: 'positive', image: 'Mãos ágeis'              },
  Dextrous:           { name: 'Destreza',                type: 'positive'                                    },
  ThickSkinned:       { name: 'Casca Grossa',            type: 'positive', image: 'Casca grossa'            },
  Resilient:          { name: 'Resiliente',              type: 'positive', image: 'Saudável'                },
  Wakeful:            { name: 'Madrugador',              type: 'positive', image: 'Madrugador'              },
  NeedsLessSleep:     { name: 'Madrugador',              type: 'positive', image: 'Madrugador'              },
  FastHealer:         { name: 'Cura Rápida',             type: 'positive', image: 'Saúde de ferro'          },
  LightEater:         { name: 'Estômago Pequeno',        type: 'positive', image: 'Estômago pequeno'        },
  LowThirst:          { name: 'Pouca Sede',              type: 'positive', image: 'Hidratado'                },

  // ── Sensoriais positivos ───────────────────────────────────
  KeenHearing:        { name: 'Audição Aguçada',         type: 'positive', image: 'Audição aguçada'         },
  EagleEyed:          { name: 'Olho de Águia',           type: 'positive', image: 'Visão aguçada'           },

  // ── Mentais / passivos positivos ───────────────────────────
  Brave:              { name: 'Corajoso',                type: 'positive', image: 'Corajoso'                },
  Organized:          { name: 'Organizado',              type: 'positive', image: 'Organizado'              },
  Lucky:              { name: 'Sortudo',                 type: 'positive', image: 'Sortudo'                  },
  FastLearner:        { name: 'Aprendiz Rápido',         type: 'positive', image: 'Aprendiz rápido'         },
  FastReader:         { name: 'Leitor Rápido',           type: 'positive', image: 'Leitura dinâmica'        },
  Handy:              { name: 'Habilidoso',              type: 'positive', image: 'Habilidoso'              },
  Outdoorsman:        { name: 'Andarilho',               type: 'positive', image: 'Andarilho'               },
  SpeedDemon:         { name: 'Bom de Volante',          type: 'positive', image: 'Bom de volante'          },
  FirstAider:         { name: 'Socorrista',              type: 'positive', image: 'Socorrista'              },
  FirstAid:           { name: 'Socorrista',              type: 'positive', image: 'Socorrista'              },
  BornSurvivor:       { name: 'Sobrevivente Nato',       type: 'positive'                                    },
  CatEyes:            { name: 'Olhos de Gato',           type: 'positive', image: 'Olhos de gato'           },
  NightVision:        { name: 'Olhos de Gato',           type: 'positive', image: 'Olhos de gato'           },
  NightOwl:           { name: 'Coruja da Noite',         type: 'positive', image: 'Coruja'                  },
  Marksman:           { name: 'Atirador',                type: 'positive'                                    },
  Hunter:             { name: 'Caçador',                 type: 'positive', image: 'Caçador'                 },
  Herbalist:          { name: 'Herbalista',              type: 'positive', image: 'Herbalista'              },
  Herbalist_Prof:     { name: 'Herbalista',              type: 'positive', image: 'Herbalista'              },
  Inconspicuous:      { name: 'Discreto',                type: 'positive', image: 'Discreto'                },
  IronGut:            { name: 'Estômago de Ferro',       type: 'positive', image: 'Estômago de ferro'       },
  AdrenalineJunkie:   { name: 'Viciado em Adrenalina',  type: 'positive', image: 'Viciado em adrenalina'   },
  Desensitized:       { name: 'Destemido',               type: 'positive', image: 'Destemido'               },
  Construction:       { name: 'Construção',              type: 'positive'                                    },

  // ── Profissões / habilidades especiais ─────────────────────
  Artisan:            { name: 'Artesão',                 type: 'positive'                                    },
  Axeman:             { name: 'Lenhador',                type: 'positive', image: 'Lenhador'                },
  BaseballPlayer:     { name: 'Jogador de Beisebol',     type: 'positive', image: 'Jogador de Beisebol'     },
  Blacksmith:         { name: 'Ferreiro',                type: 'positive'                                    },
  Blacksmith2:        { name: 'Ferreiro Especialista',   type: 'positive'                                    },
  Brawler:            { name: 'Brigador',                type: 'positive', image: 'Brigador'                },
  Burglar:            { name: 'Ladrão',                  type: 'positive', image: 'Ladrão'                  },
  Cook:               { name: 'Cozinheiro',              type: 'positive', image: 'Cozinheiro'              },
  Cook2:              { name: 'Cozinheiro Especialista', type: 'positive', image: 'Cozinheiro'              },
  Crafty:             { name: 'Engenhoso',               type: 'positive'                                    },
  Fishing:            { name: 'Pescador',                type: 'positive', image: 'Pescador'                },
  FormerScout:        { name: 'Escoteiro',               type: 'positive', image: 'Escoteiro'               },
  Gardener:           { name: 'Jardineiro',              type: 'positive', image: 'Jardineiro'              },
  Gymnast:            { name: 'Ginasta',                 type: 'positive', image: 'Ginasta'                 },
  Hiker:              { name: 'Sobrevivencialista',      type: 'positive', image: 'Sobrevivencialista'      },
  Inventive:          { name: 'Inventivo',               type: 'positive'                                    },
  Inventive_prof:     { name: 'Inventivo',               type: 'positive'                                    },
  Jogger:             { name: 'Corredor',                type: 'positive', image: 'Corredor'                },
  Mason:              { name: 'Pedreiro',                type: 'positive'                                    },
  Mechanics:          { name: 'Mecânico Amador',         type: 'positive', image: 'Mecânico amador'         },
  Mechanics2:         { name: 'Mecânico Avançado',       type: 'positive', image: 'Mecânico amador'         },
  Nutritionist:       { name: 'Nutricionista',           type: 'positive', image: 'Nutricionista'           },
  Nutritionist2:      { name: 'Nutricionista',           type: 'positive', image: 'Nutricionista'           },
  Tailor:             { name: 'Costureiro',              type: 'positive', image: 'Costureiro'              },
  WeightLoss:         { name: 'Metabolismo Acelerado',   type: 'positive'                                    },
  Whittler:           { name: 'Entalhador',              type: 'positive'                                    },
  WildernessKnowledge:{ name: 'Conhecimento Selvagem',   type: 'positive', image: 'Sobrevivencialista'      },

  // ── Físicos negativos ─────────────────────────────────────
  Weak:               { name: 'Fraco',                   type: 'negative', image: 'Fracote'                },
  Feeble:             { name: 'Franzino',                type: 'negative', image: 'Franzino'                },
  Unfit:              { name: 'Sem Condicionamento',     type: 'negative', image: 'Despreparado'            },
  Obese:              { name: 'Obeso',                   type: 'negative', image: 'Obeso'                   },
  Overweight:         { name: 'Acima do Peso',           type: 'negative', image: 'Acima do peso'           },
  OutOfShape:         { name: 'Fora de Forma',           type: 'negative', image: 'Fora de forma'           },
  VeryUnderweight:    { name: 'Muito Magro',             type: 'negative', image: 'Pele e osso'             },
  Emaciated:          { name: 'Emaciado',                type: 'negative', image: 'Emaciado'                },
  ThinSkinned:        { name: 'Pele Fina',               type: 'negative', image: 'Pele frágil'             },
  SlowHealer:         { name: 'Cura Lenta',              type: 'negative', image: 'Saúde fraca'             },
  ProneToIllness:     { name: 'Propenso a Doenças',      type: 'negative', image: 'Baixa imunidade'         },
  Smoker:             { name: 'Fumante',                 type: 'negative', image: 'Fumante'                  },
  Underweight:        { name: 'Abaixo do Peso',          type: 'negative', image: 'Magrelo'                 },
  Asthmatic:          { name: 'Asmático',                type: 'negative', image: 'Asmático'                },

  // ── Sensoriais negativos ──────────────────────────────────
  HardOfHearing:      { name: 'Duro de Ouvido',          type: 'negative', image: 'Ruim de audição'        },
  ShortSighted:       { name: 'Míope',                   type: 'negative', image: 'Míope'                   },
  Deaf:               { name: 'Surdo',                   type: 'negative', image: 'Surdo'                    },

  // ── Mentais / passivos negativos ──────────────────────────
  Cowardly:           { name: 'Covarde',                 type: 'negative', image: 'Covarde'                 },
  Clumsy:             { name: 'Desajeitado',             type: 'negative', image: 'Desajeitado'             },
  AllThumbs:          { name: 'Desastrado',              type: 'negative', image: 'Desastrado'              },
  SlowReader:         { name: 'Leitor Lento',            type: 'negative', image: 'Semi-analfabeto'         },
  SlowLearner:        { name: 'Aprendiz Lento',          type: 'negative', image: 'Aprendiz lento'          },
  Conspicuous:        { name: 'Chamativo',               type: 'negative', image: 'Estabanado'              },
  HeartyAppetite:     { name: 'Apetite Voraz',           type: 'negative', image: 'Comilão'                 },
  WeakStomach:        { name: 'Estômago Fraco',          type: 'negative', image: 'Estômago fraco'          },
  Disorganized:       { name: 'Desorganizado',           type: 'negative', image: 'Desorganizado'           },
  PanickedShot:       { name: 'Tiro em Pânico',          type: 'negative'                                    },
  Restless:           { name: 'Agitado',                 type: 'negative'                                    },
  Sleepyhead:         { name: 'Dorminhoco',              type: 'negative', image: 'Dorminhoco'              },
  NeedsMoreSleep:     { name: 'Dorminhoco',              type: 'negative', image: 'Dorminhoco'              },
  Insomniac:          { name: 'Insone',                  type: 'negative', image: 'Sono leve'               },
  HighThirst:         { name: 'Muita Sede',              type: 'negative', image: 'Sedento'                  },
  Pacifist:           { name: 'Pacifista',               type: 'negative', image: 'Pacifista'               },
  Claustrophobic:     { name: 'Claustrofóbico',          type: 'negative', image: 'Claustrofóbico'          },
  Agoraphobic:        { name: 'Agorafóbico',             type: 'negative', image: 'Agorafóbico'             },
  Hemophobic:         { name: 'Hemofóbico',              type: 'negative', image: 'Hemofóbico'              },
  Illiterate:         { name: 'Analfabeto',              type: 'negative', image: 'Analfabeto'              },
  SundayDriver:       { name: 'Mau Motorista',           type: 'negative', image: 'Ruim de volante'         },
  BetaBlocker:        { name: 'Betabloqueador',          type: 'negative'                                    },
  Glasses:            { name: 'Usa Óculos',              type: 'negative'                                    },
  WeightGain:         { name: 'Metabolismo Lento',       type: 'negative'                                    },
};

const _TRAITS_BY_PATH: Record<string, TraitDef> = Object.fromEntries(
  Object.entries(TRAITS).map(([k, v]) => [k.toLowerCase(), v]),
);

export function resolveTrait(id: string): TraitDef {
  if (TRAITS[id]) return TRAITS[id];
  const colonIdx = id.indexOf(':');
  const path = (colonIdx !== -1 ? id.slice(colonIdx + 1) : id).toLowerCase();
  return _TRAITS_BY_PATH[path] ?? { name: id, type: 'positive' };
}

export function parseTraitList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

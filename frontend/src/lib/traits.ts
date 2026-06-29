export type TraitType = "positive" | "negative";

export interface TraitDef {
  name: string;
  type: TraitType;
  image?: string; // filename (sem .png) dentro de Positivos/ ou Negativos/
  description?: string;
}

const _posImgs = import.meta.glob<string>(
  "../../assets/caracteristicas/Positivos/*.png",
  { eager: true, query: "?url", import: "default" },
);
const _negImgs = import.meta.glob<string>(
  "../../assets/caracteristicas/Negativos/*.png",
  { eager: true, query: "?url", import: "default" },
);

export function getTraitImageUrl(def: TraitDef): string | undefined {
  if (!def.image) return undefined;
  const folder = def.type === "positive" ? "Positivos" : "Negativos";
  const map = def.type === "positive" ? _posImgs : _negImgs;
  return map[`../../assets/caracteristicas/${folder}/${def.image}.png`];
}

export const TRAITS: Record<string, TraitDef> = {

  // ── Positivos — Físico ─────────────────────────────────────
  Athletic: {
    name: "Atlético",
    type: "positive",
    image: "Atlético",
    description: "Consegue correr mais rápido e por mais tempo sem se cansar.",
  },
  Fit: {
    name: "Em Forma",
    type: "positive",
    image: "Em forma",
    description: "Em boa forma física.",
  },
  Strong: {
    name: "Forte",
    type: "positive",
    image: "Forte",
    description: "Aumento do impacto de armas brancas e da capacidade de carga.",
  },
  Stout: {
    name: "Musculoso",
    type: "positive",
    image: "Musculoso",
    description: "Aumento do impacto de armas brancas e da capacidade de carga.",
  },
  Graceful: {
    name: "Gracioso",
    type: "positive",
    image: "Gracioso",
    description: "Faz menos barulho ao se movimentar.",
  },
  ThickSkinned: {
    name: "Pele Grossa",
    type: "positive",
    image: "Pele grossa",
    description: "Menor probabilidade de arranhões ou mordidas que rompam a pele.",
  },
  FastHealer: {
    name: "Saúde de Ferro",
    type: "positive",
    image: "Saúde de ferro",
    description: "Recupera-se mais rapidamente de lesões e doenças.",
  },
  LightEater: {
    name: "Estômago Pequeno",
    type: "positive",
    image: "Estômago pequeno",
    description: "Precisa comer com menos frequência.",
  },
  LowThirst: {
    name: "Hidratado",
    type: "positive",
    image: "Hidratado",
    description: "Precisa beber água com menos frequência.",
  },
  LightFooted: {
    name: "Passos Silenciosos",
    type: "positive",
    description: "Faz menos barulho ao se movimentar.",
  },
  NimbleFingers: {
    name: "Mãos Ágeis",
    type: "positive",
    image: "Mãos ágeis",
    description: "Transfere itens de estoque rapidamente.",
  },
  Dextrous: {
    name: "Mãos Ágeis",
    type: "positive",
    image: "Mãos ágeis",
    description: "Transfere itens de estoque rapidamente.",
  },
  Dexterous: {
    name: "Mãos Ágeis",
    type: "positive",
    image: "Mãos ágeis",
    description: "Transfere itens de estoque rapidamente.",
  },
  Wakeful: {
    name: "Madrugador",
    type: "positive",
    image: "Madrugador",
    description: "Precisa dormir menos.",
  },
  NeedsLessSleep: {
    name: "Madrugador",
    type: "positive",
    image: "Madrugador",
    description: "Precisa dormir menos.",
  },

  // ── Positivos — Sensorial ──────────────────────────────────
  KeenHearing: {
    name: "Audição Aguçada",
    type: "positive",
    image: "Audição aguçada",
    description: "Raio de percepção maior.",
  },
  EagleEyed: {
    name: "Olhos de Águia",
    type: "positive",
    image: "Olhos de águia",
    description: "Possui um desvanecimento de visibilidade mais rápido e um arco de visibilidade mais alto.",
  },
  CatEyes: {
    name: "Olhos de Gato",
    type: "positive",
    image: "Olhos de gato",
    description: "Melhor visão noturna.",
  },
  NightVision: {
    name: "Olhos de Gato",
    type: "positive",
    image: "Olhos de gato",
    description: "Melhor visão noturna.",
  },
  NightOwl: {
    name: "Coruja Noturna",
    type: "positive",
    image: "Coruja Noturna",
    description: "Precisa de pouco sono. Permanece extremamente alerta durante o sono.",
  },

  // ── Positivos — Mental / Passivo ──────────────────────────
  Brave: {
    name: "Corajoso",
    type: "positive",
    image: "Corajoso",
    description: "Menos propenso a entrar em pânico.",
  },
  Organized: {
    name: "Organizado",
    type: "positive",
    image: "Organizado",
    description: "Aumento da capacidade de armazenamento de contêineres.",
  },
  Lucky: {
    name: "Sortudo",
    type: "positive",
    image: "Sortudo",
    description: "Tem mais sorte ao encontrar itens raros.",
  },
  FastLearner: {
    name: "Aprendiz Rápido",
    type: "positive",
    image: "Aprendiz rápido",
    description: "Aumenta o ganho de XP.",
  },
  FastReader: {
    name: "Leitor Rápido",
    type: "positive",
    image: "Leitor Rápido",
    description: "Leva menos tempo para ler livros.",
  },
  Handy: {
    name: "Habilidoso",
    type: "positive",
    image: "Habilidoso",
    description: "Construções mais rápidas e resistentes.",
  },
  Outdoorsman: {
    name: "Andarilho",
    type: "positive",
    image: "Andarilho",
    description: "Não é afetado por condições climáticas adversas.",
  },
  SpeedDemon: {
    name: "Demônio da Velocidade",
    type: "positive",
    image: "Demônio da Velocidade",
    description: "O motorista veloz.",
  },
  FirstAider: {
    name: "Socorrista",
    type: "positive",
    image: "Socorrista",
    description: "Possui certificado de curso de RCP e primeiros socorros.",
  },
  FirstAid: {
    name: "Socorrista",
    type: "positive",
    image: "Socorrista",
    description: "Possui certificado de curso de RCP e primeiros socorros.",
  },
  Resilient: {
    name: "Saudável",
    type: "positive",
    image: "Saudável",
    description: "Menos suscetível a doenças. Taxa de zumbificação mais lenta.",
  },
  BornSurvivor: {
    name: "Sobrevivente Nato",
    type: "positive",
    description: "Habilidades inatas de sobrevivência.",
  },
  AdrenalineJunkie: {
    name: "Viciado em Adrenalina",
    type: "positive",
    image: "Viciado em adrenalina",
    description: "Move-se mais rápido quando está em pânico extremo.",
  },
  IronGut: {
    name: "Estômago de Ferro",
    type: "positive",
    image: "Estômago de ferro",
    description: "Menor probabilidade de intoxicação alimentar.",
  },
  Inconspicuous: {
    name: "Discreto",
    type: "positive",
    image: "Discreto",
    description: "Menos propenso a ser visto por zumbis.",
  },
  Inventive: {
    name: "Inventivo",
    type: "positive",
    image: "Inventivo",
    description: "Possui requisitos de habilidade mais baixos para pesquisar receitas a partir de itens.",
  },
  Inventive_prof: {
    name: "Inventivo",
    type: "positive",
    image: "Inventivo",
    description: "Possui requisitos de habilidade mais baixos para pesquisar receitas a partir de itens.",
  },
  Marksman: {
    name: "Atirador de Alvo",
    type: "positive",
    image: "Atirador de alvo",
    description: "+1 Mira",
  },
  Herbalist: {
    name: "Herbalista",
    type: "positive",
    image: "Herbalista",
    description: "É possível encontrar plantas medicinais e preparar remédios e cataplasmas a partir delas.",
  },
  Herbalist_Prof: {
    name: "Herbalista",
    type: "positive",
    image: "Herbalista",
    description: "É possível encontrar plantas medicinais e preparar remédios e cataplasmas a partir delas.",
  },
  Desensitized: {
    name: "Destemido",
    type: "positive",
    image: "Destemido",
    description: "Não chega a estados de pânico.",
  },
  Construction: {
    name: "Construção",
    type: "positive",
    description: "Habilidade adicional de construção.",
  },

  // ── Positivos — Profissões / habilidades especiais ─────────
  Artisan: {
    name: "Artesão",
    type: "positive",
    image: "Artesão",
    description: "Tem mais habilidade em trabalhos com cerâmica e vidro.",
  },
  Axeman: {
    name: "Lenhador",
    type: "positive",
    image: "Lenhador",
    description: "Melhor em cortar árvores. Golpe de machado mais rápido.",
  },
  BaseballPlayer: {
    name: "Jogador de Beisebol",
    type: "positive",
    image: "Jogador de Beisebol",
    description: "Tem prática com um taco de beisebol e sabe como rebater com precisão.",
  },
  Biologist: {
    name: "Biólogo",
    type: "positive",
    image: "Biólogo",
    description: "É possível encontrar ervas medicinais, fabricar ferramentas simples de pedra e osso, e acender fogueiras mais rapidamente.",
  },
  Blacksmith: {
    name: "Conhecimento de Ferreiro",
    type: "positive",
    image: "Ferreiro",
    description: "É possível usar uma bigorna para criar objetos de metal.",
  },
  Blacksmith2: {
    name: "Ferreiro",
    type: "positive",
    image: "Ferreiro",
    description: "É possível usar uma bigorna para criar objetos de metal.",
  },
  Brawler: {
    name: "Brigador",
    type: "positive",
    image: "Brigador",
    description: "Acostumado(a) a se meter em encrenca.",
  },
  Burglar: {
    name: "Ladrão",
    type: "positive",
    image: "Ladrão",
    description: "É possível ligar veículos sem a chave, reduzindo o risco de quebrar a fechadura de um vidro.",
  },
  Cook: {
    name: "Cozinheiro",
    type: "positive",
    image: "Cozinheiro",
    description: "Conhece receitas culinárias.",
  },
  Cook2: {
    name: "Cozinheiro",
    type: "positive",
    image: "Cozinheiro",
    description: "Sabe cozinhar.",
  },
  Crafty: {
    name: "Astuto",
    type: "positive",
    image: "Astuto",
    description: "Aumento nos ganhos de XP para habilidades de Criação.",
  },
  Fishing: {
    name: "Pescador",
    type: "positive",
    image: "Pescador",
    description: "Conhece os princípios básicos da pesca.",
  },
  FormerScout: {
    name: "Ex-Escoteiro",
    type: "positive",
    image: "Ex-escoteiro",
    description: "Sabe colher frutos silvestres e tratar pequenos ferimentos.",
  },
  Gardener: {
    name: "Jardineiro",
    type: "positive",
    image: "Jardineiro",
    description: "Possui conhecimentos básicos de agricultura.",
  },
  Gymnast: {
    name: "Ginasta",
    type: "positive",
    image: "Ginasta",
    description: "Ágil e discreto.",
  },
  Handyman: {
    name: "Faz-Tudo",
    type: "positive",
    image: "Faz-tudo",
    description: "+1 Manutenção",
  },
  AllRounder: {
    name: "Faz-Tudo",
    type: "positive",
    image: "Faz-tudo",
    description: "+1 Manutenção",
  },
  Hiker: {
    name: "Sobrevivencialista",
    type: "positive",
    image: "Sobrevivencialista",
    description: "Acostumado a sobreviver na selva.",
  },
  Hunter: {
    name: "Caçador",
    type: "positive",
    image: "Caçador",
    description: "Conheça os princípios básicos da caça.",
  },
  Jogger: {
    name: "Corredor",
    type: "positive",
    image: "Corredor",
    description: "Corredor nas horas vagas.",
  },
  Mason: {
    name: "Pedreiro",
    type: "positive",
    image: "Pedreiro",
    description: "Melhor na construção de estruturas de pedra e tijolo.",
  },
  Mechanics: {
    name: "Mecânico Amador",
    type: "positive",
    image: "Mecânico amador",
    description: "Possui conhecimento detalhado de modelos de veículos comuns e pesados e seus respectivos reparos.",
  },
  Mechanics2: {
    name: "Mecânico Amador",
    type: "positive",
    image: "Mecânico amador",
    description: "Familiarizado com a manutenção e o reparo de todos os modelos de veículos nas estradas do Kentucky.",
  },
  Nutritionist: {
    name: "Nutricionista",
    type: "positive",
    image: "Nutricionista",
    description: "É possível visualizar os valores nutricionais de qualquer alimento.",
  },
  Nutritionist2: {
    name: "Nutricionista",
    type: "positive",
    image: "Nutricionista",
    description: "É possível visualizar os valores nutricionais de qualquer alimento.",
  },
  Tailor: {
    name: "Costureiro",
    type: "positive",
    image: "Costureiro",
    description: "+1 Alfaiataria",
  },
  Whittler: {
    name: "Entalhador",
    type: "positive",
    image: "Entalhador",
    description: "Capaz de esculpir peças em madeira e osso.",
  },
  WildernessKnowledge: {
    name: "Sobrevivencialista",
    type: "positive",
    image: "Sobrevivencialista",
    description: "Acostumado a sobreviver na selva.",
  },
  Tinkerer: { name: "Tinkerer", type: "positive" },
  tinkerer: { name: "Tinkerer", type: "positive" },

  // ── Negativos — Físico ────────────────────────────────────
  Weak: {
    name: "Fraco",
    type: "negative",
    image: "Fraco",
    description: "Menos recuo de armas de combate corpo a corpo. Capacidade de carga reduzida.",
  },
  Feeble: {
    name: "Fracote",
    type: "negative",
    image: "Fracote",
    description: "Menos recuo de armas de combate corpo a corpo. Capacidade de carga reduzida.",
  },
  Unfit: {
    name: "Sedentário",
    type: "negative",
    image: "Sedentário",
    description: "Resistência muito baixa, regeneração com resistência muito baixa.",
  },
  OutOfShape: {
    name: "Fora de Forma",
    type: "negative",
    image: "Fora de forma",
    description: "Perda de resistência mais rápida.",
  },
  Obese: {
    name: "Obeso",
    type: "negative",
    image: "Obeso",
    description: "Velocidade de corrida reduzida, resistência muito baixa e propensão a lesões.",
  },
  Overweight: {
    name: "Acima do Peso",
    type: "negative",
    image: "Acima do peso",
    description: "Velocidade de corrida reduzida, baixa resistência e propensão a lesões.",
  },
  VeryUnderweight: {
    name: "Pele e Osso",
    type: "negative",
    image: "Pele e osso",
    description: "Pouca força, pouca resistência e propensão a lesões.",
  },
  Emaciated: {
    name: "Pele e Osso",
    type: "negative",
    image: "Pele e osso",
    description: "Pouca força, pouca resistência e propensão a lesões.",
  },
  Underweight: {
    name: "Magrelo",
    type: "negative",
    image: "Magrelo",
    description: "Força muito baixa, resistência muito baixa e propensão a lesões.",
  },
  LightWeight: {
    name: "Peso Leve",
    type: "negative",
    image: "Peso leve",
    description: "Pouca força, pouca resistência e propensão a lesões.",
  },
  ThinSkinned: {
    name: "Pele Frágil",
    type: "negative",
    image: "Pele frágil",
    description: "Maior probabilidade de arranhões, lacerações ou mordidas que rompam a pele.",
  },
  SlowHealer: {
    name: "Saúde Fraca",
    type: "negative",
    image: "Saúde fraca",
    description: "Recupera-se lentamente de lesões e doenças.",
  },
  ProneToIllness: {
    name: "Baixa Imunidade",
    type: "negative",
    image: "Baixa imunidade",
    description: "Maior propensão a doenças. Taxa de zumbificação mais rápida.",
  },
  Smoker: {
    name: "Fumante",
    type: "negative",
    image: "Fumante",
    description: "O estresse e a infelicidade diminuem após o consumo de tabaco. A infelicidade aumenta quando o tabaco não é fumado.",
  },
  Asthmatic: {
    name: "Asmático",
    type: "negative",
    image: "Asmático",
    description: "Perde resistência rapidamente.",
  },
  WeightLoss: {
    name: "Metabolismo Rápido",
    type: "negative",
    image: "Metabolismo rápido",
    description: "Tendência permanente à perda de peso. Começa com a característica de baixo peso.",
  },
  WeightGain: {
    name: "Metabolismo Lento",
    type: "negative",
    image: "Metabolismo lento",
    description: "Tendência permanente ao ganho de peso. Inicia-se com a característica de Alto Peso.",
  },

  // ── Negativos — Sensorial ─────────────────────────────────
  HardOfHearing: {
    name: "Ruim de Audição",
    type: "negative",
    image: "Ruim de audição",
    description: "Raio de percepção menor. Alcance auditivo menor.",
  },
  ShortSighted: {
    name: "Míope",
    type: "negative",
    image: "Míope",
    description: "Visão a curta distância. Desvanecimento da visibilidade mais lento.",
  },
  Deaf: {
    name: "Surdo",
    type: "negative",
    image: "Surdo",
    description: "Raio de percepção e alcance auditivo menores.",
  },

  // ── Negativos — Mental / Passivo ──────────────────────────
  Cowardly: {
    name: "Covarde",
    type: "negative",
    image: "Covarde",
    description: "Especialmente propenso a entrar em pânico.",
  },
  Clumsy: {
    name: "Desajeitado",
    type: "negative",
    image: "Desajeitado",
    description: "Transfere itens do estoque lentamente.",
  },
  AllThumbs: {
    name: "Desastrado",
    type: "negative",
    image: "Desastrado",
    description: "Faz mais barulho ao se movimentar.",
  },
  SlowReader: {
    name: "Semi-Analfabeto",
    type: "negative",
    image: "Semi-analfabeto",
    description: "Leva mais tempo para ler livros.",
  },
  SlowLearner: {
    name: "Aprendiz Lento",
    type: "negative",
    image: "Aprendiz lento",
    description: "Ganhos de XP reduzidos.",
  },
  Conspicuous: {
    name: "Estabanado",
    type: "negative",
    image: "Estabanado",
    description: "Maior probabilidade de ser avistado por zumbis.",
  },
  HeartyAppetite: {
    name: "Comilão",
    type: "negative",
    image: "Comilão",
    description: "Precisa se alimentar com mais regularidade.",
  },
  WeakStomach: {
    name: "Estômago Fraco",
    type: "negative",
    image: "Estômago fraco",
    description: "Maior probabilidade de contrair intoxicação alimentar.",
  },
  Disorganized: {
    name: "Desorganizado",
    type: "negative",
    image: "Desorganizado",
    description: "Capacidade de estoque de contêineres reduzida.",
  },
  PanickedShot: {
    name: "Tiro em Pânico",
    type: "negative",
    description: "Perde precisão ao atirar em pânico.",
  },
  Restless: {
    name: "Agitado",
    type: "negative",
    description: "Dificuldade para descansar.",
  },
  Sleepyhead: {
    name: "Dorminhoco",
    type: "negative",
    image: "Dorminhoco",
    description: "Precisa dormir mais.",
  },
  NeedsMoreSleep: {
    name: "Dorminhoco",
    type: "negative",
    image: "Dorminhoco",
    description: "Precisa dormir mais.",
  },
  Insomniac: {
    name: "Sono Leve",
    type: "negative",
    image: "Sono leve",
    description: "Perda gradual do cansaço durante o sono.",
  },
  HighThirst: {
    name: "Sedento",
    type: "negative",
    image: "Sedento",
    description: "Precisa de mais água para sobreviver.",
  },
  Pacifist: {
    name: "Pacifista",
    type: "negative",
    image: "Pacifista",
    description: "Menos eficaz com armas.",
  },
  Claustrophobic: {
    name: "Claustrofóbico",
    type: "negative",
    image: "Claustrofóbico",
    description: "Entra em pânico quando está em ambientes fechados.",
  },
  Agoraphobic: {
    name: "Agorafóbico",
    type: "negative",
    image: "Agorafóbico",
    description: "Entra em pânico quando está ao ar livre.",
  },
  Hemophobic: {
    name: "Fobia de Sangue",
    type: "negative",
    image: "Fobia de Sangue",
    description: "Entra em pânico ao realizar primeiros socorros em si mesmo. Fica estressado quando está ensanguentado.",
  },
  Illiterate: {
    name: "Analfabeto",
    type: "negative",
    image: "Analfabeto",
    description: "Não consegue ler livros.",
  },
  SundayDriver: {
    name: "Ruim de Volante",
    type: "negative",
    image: "Ruim de volante",
    description: "O motorista muito lento.",
  },
  BetaBlocker: {
    name: "Betabloqueador",
    type: "negative",
    description: "Efeitos colaterais do uso de betabloqueadores.",
  },
  Glasses: {
    name: "Usa Óculos",
    type: "negative",
    description: "Depende de óculos para enxergar bem.",
  },
};

const _TRAITS_BY_PATH: Record<string, TraitDef> = Object.fromEntries(
  Object.entries(TRAITS).map(([k, v]) => [k.toLowerCase(), v]),
);

export function resolveTrait(id: string): TraitDef {
  if (TRAITS[id]) return TRAITS[id];
  const colonIdx = id.indexOf(":");
  const path = (colonIdx !== -1 ? id.slice(colonIdx + 1) : id).toLowerCase();
  if (_TRAITS_BY_PATH[path]) return _TRAITS_BY_PATH[path];
  const pathNoSpace = path.replace(/\s+/g, "");
  return _TRAITS_BY_PATH[pathNoSpace] ?? { name: id, type: "positive" };
}

export function parseTraitList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
export type TraitType = 'positive' | 'negative';

export interface TraitDef {
  name: string;   // PT-BR
  type: TraitType;
}

export const TRAITS: Record<string, TraitDef> = {
  // ── Físicos positivos ──────────────────────────────────────
  Athletic:         { name: 'Atlético',               type: 'positive' },
  Fit:              { name: 'Em Forma',                type: 'positive' },
  Strong:           { name: 'Forte',                   type: 'positive' },
  Stout:            { name: 'Robusto',                 type: 'positive' },
  Graceful:         { name: 'Gracioso',                type: 'positive' },
  LightFooted:      { name: 'Passos Silenciosos',      type: 'positive' },
  NimbleFingers:    { name: 'Dedos Ágeis',             type: 'positive' },
  Dextrous:         { name: 'Destreza',                type: 'positive' },
  ThickSkinned:     { name: 'Pele Grossa',             type: 'positive' },
  Resilient:        { name: 'Resiliente',              type: 'positive' },
  Wakeful:          { name: 'Vigilante',               type: 'positive' },
  VeryUnderweight:  { name: 'Muito Magro',             type: 'positive' },

  // ── Sensoriais positivos ───────────────────────────────────
  KeenHearing:      { name: 'Audição Aguçada',         type: 'positive' },
  EagleEyed:        { name: 'Olho de Águia',           type: 'positive' },

  // ── Mentais / passivos positivos ───────────────────────────
  Brave:            { name: 'Corajoso',                type: 'positive' },
  Organized:        { name: 'Organizado',              type: 'positive' },
  Lucky:            { name: 'Sortudo',                 type: 'positive' },
  FastLearner:      { name: 'Aprendiz Rápido',         type: 'positive' },
  FastReader:       { name: 'Leitor Rápido',           type: 'positive' },
  Handy:            { name: 'Habilidoso',              type: 'positive' },
  Outdoorsman:      { name: 'Sobrevivencialista',      type: 'positive' },
  SpeedDemon:       { name: 'Demônio da Velocidade',   type: 'positive' },
  FirstAider:       { name: 'Primeiros Socorros',      type: 'positive' },
  BornSurvivor:     { name: 'Sobrevivente Nato',       type: 'positive' },
  CatEyes:          { name: 'Olhos de Gato',           type: 'positive' },
  Marksman:         { name: 'Atirador de Elite',       type: 'positive' },
  Hunter:           { name: 'Caçador',                 type: 'positive' },
  Herbalist:        { name: 'Herbalista',              type: 'positive' },
  Inconspicuous:    { name: 'Discreto',                type: 'positive' },
  IronGut:          { name: 'Estômago de Ferro',       type: 'positive' },
  Wakeful2:         { name: 'Leve Sono',               type: 'positive' },
  Desensitized:     { name: 'Dessensibilizado',        type: 'positive' },
  Construction:     { name: 'Construção',              type: 'positive' },

  // ── Físicos negativos ─────────────────────────────────────
  Weak:             { name: 'Fraco',                   type: 'negative' },
  Unfit:            { name: 'Sem Condicionamento',     type: 'negative' },
  Obese:            { name: 'Obeso',                   type: 'negative' },
  Overweight:       { name: 'Acima do Peso',           type: 'negative' },
  OutOfShape:       { name: 'Fora de Forma',           type: 'negative' },
  ThinSkinned:      { name: 'Pele Fina',               type: 'negative' },
  SlowHealer:       { name: 'Cura Lenta',              type: 'negative' },
  ProneToIllness:   { name: 'Propenso a Doenças',      type: 'negative' },
  Smoker:           { name: 'Fumante',                 type: 'negative' },
  Underweight:      { name: 'Abaixo do Peso',          type: 'negative' },

  // ── Sensoriais negativos ──────────────────────────────────
  HardOfHearing:    { name: 'Duro de Ouvido',          type: 'negative' },
  ShortSighted:     { name: 'Míope',                   type: 'negative' },
  Deaf:             { name: 'Surdo',                   type: 'negative' },

  // ── Mentais / passivos negativos ──────────────────────────
  Cowardly:         { name: 'Covarde',                 type: 'negative' },
  Clumsy:           { name: 'Desajeitado',             type: 'negative' },
  SlowReader:       { name: 'Leitor Lento',            type: 'negative' },
  SlowLearner:      { name: 'Aprendiz Lento',          type: 'negative' },
  Conspicuous:      { name: 'Chamativo',               type: 'negative' },
  HeartyAppetite:   { name: 'Apetite Voraz',           type: 'negative' },
  PanickedShot:     { name: 'Tiro em Pânico',          type: 'negative' },
  Restless:         { name: 'Agitado',                 type: 'negative' },
  Sleepyhead:       { name: 'Dorminhoco',              type: 'negative' },
  Pacifist:         { name: 'Pacifista',               type: 'negative' },
  Claustrophobic:   { name: 'Claustrofóbico',          type: 'negative' },
  Agoraphobic:      { name: 'Agorafóbico',             type: 'negative' },
  Hemophobic:       { name: 'Hemofóbico',              type: 'negative' },
  Illiterate:       { name: 'Analfabeto',              type: 'negative' },
  BetaBlocker:      { name: 'Betabloqueador',          type: 'negative' },
  Glasses:          { name: 'Usa Óculos',              type: 'negative' },
};

export function resolveTrait(id: string): TraitDef {
  return TRAITS[id] ?? { name: id, type: 'positive' };
}

export function parseTraitList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

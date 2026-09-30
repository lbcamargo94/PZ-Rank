// Trava de plausibilidade dos abates (v4.28.2).
//
// O código de rank é só embaralhado (a chave está no próprio mod), então dá para editar os
// números e montar outro código. O servidor não tem como provar que um código veio do jogo;
// o que dá para fazer é recusar números que nenhum jogo produz.
//
// Referência em produção (29/09/2026, runs com 1+ dia): mediana 0,9 abate por hora de jogo,
// 1% mais rápido ~10/h, recorde legítimo 13/h. O caso que motivou a trava (Anastacia Glubby)
// chegou com 400.000 abates em 56 h — 7.126/h.
//
// Limite: 50 abates por hora de jogo (5x o recorde real) + folga fixa para o começo da run,
// quando poucas horas com uma horda grande distorcem a taxa.
export const MAX_KILLS_PER_GAME_HOUR = 50;
export const KILLS_GRACE = 300;

export function maxPlausibleKills(gameMinutes: number): number {
  return KILLS_GRACE + MAX_KILLS_PER_GAME_HOUR * Math.max(0, gameMinutes) / 60;
}

// Total da run: abates acima do possível para o tempo de jogo.
export function isImplausibleTotal(kills: number, timeRaw: number): boolean {
  return kills > maxPlausibleKills(timeRaw);
}

// Salto entre dois syncs da MESMA run (tempo não regrediu): abates novos acima do possível
// para o tempo jogado desde o último sync.
export function isImplausibleJump(
  prev: { kills: number; time_raw: number },
  kills: number,
  timeRaw: number,
): boolean {
  if (timeRaw < prev.time_raw) return false; // run nova: só o total vale
  return kills - prev.kills > maxPlausibleKills(timeRaw - prev.time_raw);
}

// Anomalia gravada na run para o moderador revisar: "implausible_kills:<abates>@<minutos>"
export function implausibleFlag(kills: number, timeRaw: number): string {
  return `implausible_kills:${kills}@${timeRaw}`;
}

// ── Habilidades ─────────────────────────────────────────────────────────────
// Caso Anastacia Glubby: em 10 minutos chegaram códigos com várias habilidades em 7-10 e,
// no último, quase todas em 0 — habilidade não diminui no jogo, e nível 10 real mais
// rápido visto em produção levou 136 h de jogo.
//
// Aptidão Física e Força ficam de fora: no jogo elas caem sem exercício ou abaixo do peso.
// Referência (29/09/2026): profissão + traços dão até ~32 níveis somados no início; nenhuma
// run real passa de 40 + 1 nível por hora de jogo (a mais próxima chega a 80%).
const PASSIVE_SKILLS = new Set(['Aptidão Física', 'Força', 'Fitness', 'Strength']);
export const SKILL_GRACE_LEVELS = 40;
export const MAX_SKILL_LEVELS_PER_GAME_HOUR = 1;
// Entre dois syncs: cada nível ganho dispara sync no mod, então ganho grande sem tempo = editado
export const SKILL_JUMP_GRACE = 10;

// "Machado 7, Força 5" (entries.skills) ou ["Machado 7", ...] (decoded.skills) → { Machado: 7 }
export function parseSkillLevels(skills: string | string[] | null | undefined): Record<string, number> {
  const list = Array.isArray(skills) ? skills : (skills ?? '').split(',');
  const out: Record<string, number> = {};
  for (const raw of list) {
    const t = raw.trim();
    const i = t.lastIndexOf(' ');
    if (i <= 0) continue;
    const name = t.slice(0, i);
    const level = parseInt(t.slice(i + 1), 10);
    if (!isNaN(level) && !PASSIVE_SKILLS.has(name)) out[name] = level;
  }
  return out;
}

function sumLevels(levels: Record<string, number>): number {
  return Object.values(levels).reduce((a, b) => a + b, 0);
}

export function isImplausibleSkillTotal(skills: string | string[] | null | undefined, timeRaw: number): boolean {
  return sumLevels(parseSkillLevels(skills)) > SKILL_GRACE_LEVELS + MAX_SKILL_LEVELS_PER_GAME_HOUR * Math.max(0, timeRaw) / 60;
}

// Mesma run (tempo não regrediu): ganho acima do possível no intervalo ('jump', recusa o
// sync) ou nível que diminuiu ('decrease', só aviso: o B42.19 renomeou IDs de habilidade e um
// mod com mapeamento errado informa 0 — recusar puniria jogador honesto).
// Só compara habilidades presentes nos dois códigos.
export function skillChangeIssue(
  prev: { skills: string | null; time_raw: number },
  skills: string | string[],
  timeRaw: number,
): 'jump' | 'decrease' | null {
  if (timeRaw < prev.time_raw) return null; // run nova
  const before = parseSkillLevels(prev.skills);
  const after  = parseSkillLevels(skills);
  let gained = 0;
  let decreased = false;
  for (const [name, level] of Object.entries(after)) {
    const old = before[name];
    if (old === undefined) continue;
    if (level < old) decreased = true;
    else gained += level - old;
  }
  if (gained > SKILL_JUMP_GRACE + MAX_SKILL_LEVELS_PER_GAME_HOUR * (timeRaw - prev.time_raw) / 60) return 'jump';
  return decreased ? 'decrease' : null;
}

export function implausibleSkillsFlag(sum: number, timeRaw: number): string {
  return `implausible_skills:${sum}@${timeRaw}`;
}

export function skillLevelSum(skills: string | string[] | null | undefined): number {
  return sumLevels(parseSkillLevels(skills));
}

// Habilidades que caíram entre dois syncs, para o aviso skills_regression mostrar qual foi:
// "skills_regression:Machado 8>0,Lança 3>1" (no máximo 5, para não inflar a coluna)
export function skillsRegressionFlag(
  prev: { skills: string | null },
  skills: string | string[],
): string {
  const before = parseSkillLevels(prev.skills);
  const after  = parseSkillLevels(skills);
  const fell = Object.entries(after)
    .filter(([name, level]) => before[name] !== undefined && level < before[name]!)
    .slice(0, 5)
    .map(([name, level]) => `${name} ${before[name]}>${level}`);
  return `skills_regression:${fell.join(',')}`;
}

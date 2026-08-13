import type { Objectives } from '../types';

const SCORE_KILLS_PER_KILL = 0.1;
const SCORE_KILLS_MAX      = 800_000;
const SCORE_SKILL_10       = 1_000;
const SCORE_SPIFFO_DONE    = 1_000;
const SCORE_MILITARY       = 5_000;
const SCORE_SPIFFO_HQ      = 5_000;
const SCORE_SPIFFO_RELIC   = 3_000;

export const OFFICIAL_BASE_IDS = new Set([
  'riverside', 'rosewood', 'irvington', 'ekron',
  'muldraugh', 'muldraugh_cross', 'west_point',
  'louisville_w', 'louisville_hq', 'louisville_e', 'louisville_c',
  'brandenburg',
]);

/** Conta quantas skills estão no nível 10 a partir da coluna `skills` armazenada no banco.
 *  Formato: "Machado 10, Força 8, Vigilância 10, ..." (nome traduzido + nível). */
export function countSkills10(skillsStr: string | null | undefined): number {
  if (!skillsStr) return 0;
  let count = 0;
  for (const part of skillsStr.split(',')) {
    const trimmed = part.trim();
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace >= 0 && trimmed.slice(lastSpace + 1) === '10') count++;
  }
  return count;
}

export function computeScore(
  kills:        number,
  skills10Count: number,
  objectives?:  Partial<Objectives> | null,
): number {
  let score = Math.round(Math.min(Math.max(0, kills || 0), SCORE_KILLS_MAX) * SCORE_KILLS_PER_KILL);

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
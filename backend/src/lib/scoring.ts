import type { Objectives } from '../types';

const BASE_ITEMS = ['bed', 'windows', 'sink', 'power', 'food', 'vehicle'] as const;

export function computeScore(
  days: number,
  kills: number,
  objectives?: Partial<Objectives> | null,
): number {
  let score = days * 5 + kills;

  if (objectives?.bases) {
    for (const base of Object.values(objectives.bases)) {
      if (!base.has_base) continue;
      score += 50;
      for (const item of BASE_ITEMS) {
        if (base[item]) score += 10;
      }
    }
  }
  if (objectives?.kills_500k)    score += 500;
  if (objectives?.all_skills_10) score += 500;
  if (objectives?.spiffo_statue) score += 300;
  if (objectives?.military_base) score += 300;

  return score;
}

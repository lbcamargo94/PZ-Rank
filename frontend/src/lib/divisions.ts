export type Division = 'A' | 'B' | 'C';

export interface DivisionDef {
  division: Division;
  label:    string;
  icon:     string;
  range:    string;
  cssVar:   string;
}

export const DIVISIONS: Record<Division, DivisionDef> = {
  A: { division: 'A', label: 'Série A', icon: '🥇', range: 'Top 10',    cssVar: 'var(--gold)'   },
  B: { division: 'B', label: 'Série B', icon: '🥈', range: '11º – 30º', cssVar: 'var(--silver)' },
  C: { division: 'C', label: 'Série C', icon: '🥉', range: '31º+',      cssVar: 'var(--bronze)' },
};

export function getDivision(rank: number): DivisionDef {
  if (rank <= 10) return DIVISIONS.A;
  if (rank <= 30) return DIVISIONS.B;
  return DIVISIONS.C;
}

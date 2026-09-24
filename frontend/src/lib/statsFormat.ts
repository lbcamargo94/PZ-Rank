// Formatação pt-BR usada na página /estatisticas (1.482.392 · 18,4% · 6,3)
const INT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const DEC = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const fmtInt = (n: number) => INT.format(Math.round(n));
export const fmtDec = (n: number) => DEC.format(n);
export const fmtPct = (n: number) => `${DEC.format(n)}%`;

export function fmtDays(n: number): string {
  const v = Math.round(n * 10) / 10;
  return `${Number.isInteger(v) ? INT.format(v) : DEC.format(v)} ${v === 1 ? 'dia' : 'dias'}`;
}

export function fmtRange(min: number, max: number | null, unit = ''): string {
  const suffix = unit ? ` ${unit}` : '';
  return max === null ? `${fmtInt(min)}+${suffix}` : `${fmtInt(min)}–${fmtInt(max)}${suffix}`;
}

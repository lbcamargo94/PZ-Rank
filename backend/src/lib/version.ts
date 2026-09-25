/** Compara versões "X.Y.Z" (partes ausentes = 0). null/vazio nunca atinge o mínimo. */
export function isVersionAtLeast(version: string | null | undefined, minimum: string): boolean {
  if (!version) return false;
  const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
  const a = parse(version);
  const b = parse(minimum);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return true;
}

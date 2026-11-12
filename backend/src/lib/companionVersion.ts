// Versão do PZ Rank Companion informada no cabeçalho X-Companion-Version (Companion 2.7.0+).
// O valor vem do cliente: aceita só "X.Y.Z" numérico e curto, para nunca gravar texto livre.
const SEMVER = /^(\d{1,4})\.(\d{1,4})\.(\d{1,4})$/;

export function parseCompanionVersion(raw: string | undefined | null): string | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim();
  return SEMVER.test(v) ? v : null;
}

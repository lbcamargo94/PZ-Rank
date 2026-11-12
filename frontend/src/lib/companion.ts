// Fonte única da versão/links de download do PZ Rank Companion.
// Atualizar SÓ aqui a cada novo release — antes disso, a versão e os links
// ficavam duplicados em LinksUteisPage, Header e RegrasPage, e divergiam
// silenciosamente quando só um dos lugares era atualizado (ficou 9 versões
// desatualizado em dois deles antes de ser notado).
// Repositório público só com os instaladores: o do código-fonte é privado e o GitHub
// responde 404 para os downloads dele.
const COMPANION_REPO = 'https://github.com/lbcamargo94/PZ-Rank-Companion-Releases';

export const COMPANION_VERSION = '2.7.0';       // sem "v" — usado nos nomes de arquivo dos assets
export const COMPANION_TAG     = `v${COMPANION_VERSION}`; // com "v" — usado na URL da tag e exibido ao usuário

export const COMPANION_LATEST_URL     = `${COMPANION_REPO}/releases/latest`;
export const COMPANION_WIN_URL        = `${COMPANION_REPO}/releases/download/${COMPANION_TAG}/PZ.Rank.Companion.Setup.${COMPANION_VERSION}.exe`;
export const COMPANION_MAC_ARM_URL    = `${COMPANION_REPO}/releases/download/${COMPANION_TAG}/PZ.Rank.Companion.${COMPANION_VERSION}.Mac.arm64.dmg`;
export const COMPANION_MAC_X64_URL    = `${COMPANION_REPO}/releases/download/${COMPANION_TAG}/PZ.Rank.Companion.${COMPANION_VERSION}.Mac.x64.dmg`;
export const COMPANION_LINUX_APPIMAGE_URL = `${COMPANION_REPO}/releases/download/${COMPANION_TAG}/PZ.Rank.Companion.${COMPANION_VERSION}.AppImage`;
export const COMPANION_LINUX_DEB_URL      = `${COMPANION_REPO}/releases/download/${COMPANION_TAG}/PZ.Rank.Companion.${COMPANION_VERSION}.deb`;

export const STEAM_WORKSHOP_URL = 'https://steamcommunity.com/sharedfiles/filedetails/?id=3746228308';

/** true quando o jogador usa um Companion mais antigo que o atual. `null` = Companion
 *  anterior à 2.7.0, que não informa a versão no sync (inclui a 2.6.0, cujo atualizador
 *  automático parou de funcionar e precisa ser trocada à mão). */
export function isCompanionOutdated(version: string | null | undefined): boolean {
  if (!version) return true;
  const cur = COMPANION_VERSION.split('.').map(Number);
  const got = version.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const a = got[i] ?? 0, c = cur[i] ?? 0;
    if (Number.isNaN(a)) return true;
    if (a !== c) return a < c;
  }
  return false;
}

// Fonte única da versão/links de download do PZ Rank Companion.
// Atualizar SÓ aqui a cada novo release — antes disso, a versão e os links
// ficavam duplicados em LinksUteisPage, Header e RegrasPage, e divergiam
// silenciosamente quando só um dos lugares era atualizado (ficou 9 versões
// desatualizado em dois deles antes de ser notado).
const COMPANION_REPO = 'https://github.com/lbcamargo94/PZ-Rank-Companion';

export const COMPANION_VERSION = '2.0.8';       // sem "v" — usado nos nomes de arquivo dos assets
export const COMPANION_TAG     = `v${COMPANION_VERSION}`; // com "v" — usado na URL da tag e exibido ao usuário

export const COMPANION_LATEST_URL     = `${COMPANION_REPO}/releases/latest`;
export const COMPANION_WIN_URL        = `${COMPANION_REPO}/releases/download/${COMPANION_TAG}/PZ.Rank.Companion.Setup.${COMPANION_VERSION}.exe`;
export const COMPANION_MAC_ARM_URL    = `${COMPANION_REPO}/releases/download/${COMPANION_TAG}/PZ.Rank.Companion.${COMPANION_VERSION}.Mac.arm64.dmg`;
export const COMPANION_MAC_X64_URL    = `${COMPANION_REPO}/releases/download/${COMPANION_TAG}/PZ.Rank.Companion.${COMPANION_VERSION}.Mac.x64.dmg`;
export const COMPANION_LINUX_APPIMAGE_URL = `${COMPANION_REPO}/releases/download/${COMPANION_TAG}/PZ.Rank.Companion.${COMPANION_VERSION}.AppImage`;
export const COMPANION_LINUX_DEB_URL      = `${COMPANION_REPO}/releases/download/${COMPANION_TAG}/PZ.Rank.Companion.${COMPANION_VERSION}.deb`;

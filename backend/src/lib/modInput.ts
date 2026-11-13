// Validação do cadastro de mods (POST/PATCH /mods). O mod_id vai para a whitelist do
// Companion (linhas "ALLOW:<id>" / "REQUIRE:<id>") e é comparado com o mods.txt do save,
// então precisa ser um ID de verdade, não uma frase copiada da página da Oficina.

// Aceita ".../filedetails/?id=123" e também ".../filedetails/123" (sem "?id=").
export function extractWorkshopId(workshopUrl: string): string | null {
  const match = workshopUrl.match(/[?&]id=(\d+)/) ?? workshopUrl.match(/\/filedetails\/(\d+)(?:[/?#]|$)/);
  return match ? match[1] : null;
}

// Reescreve qualquer link de item da Oficina no formato único usado pelo resto do sistema
// (imagem, agrupamento por item, comparação de duplicatas).
export function canonicalWorkshopUrl(workshopUrl: string): string {
  const id = extractWorkshopId(workshopUrl);
  return id ? `https://steamcommunity.com/sharedfiles/filedetails/?id=${id}` : workshopUrl;
}

export const MOD_ID_MAX = 100;

// Retorna a mensagem de erro, ou null se o mod_id é aceitável.
// IDs reais do PZ podem ter espaço ("Saint Hairstyles"), mas não aspas, vírgula,
// quebra de linha nem dezenas de caracteres (apóstrofo pode: "Yaki's-Hair-Salon-Patch-Lite-B42").
export function modIdError(modId: string | null): string | null {
  if (modId === null) return null;
  if (modId.length > MOD_ID_MAX) return `O ID do mod tem mais de ${MOD_ID_MAX} caracteres. Use o "Mod ID" da página da Oficina, não a descrição.`;
  if (!/[A-Za-z0-9]/.test(modId)) return 'O ID do mod precisa ter ao menos uma letra ou número.';
  if (/[",;=\r\n\t]/.test(modId)) return 'O ID do mod não pode ter aspas duplas, vírgula, ponto e vírgula, "=" nem quebra de linha.';
  return null;
}

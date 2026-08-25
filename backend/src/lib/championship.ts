/**
 * Filtro de conteúdo: decide se uma live detectada é do campeonato (Brasileirão
 * de Project Zomboid) antes de notificar o Discord. Sem isso, qualquer live do
 * jogador — de qualquer jogo ou assunto — dispara a notificação "está AO VIVO!",
 * já que o site só sabe que o canal está transmitindo, não o quê.
 *
 * Critério por plataforma (definido com o usuário):
 *   - Twitch: usa a categoria/jogo oficial da stream (campo confiável, a própria
 *     Twitch já rastreia isso) — dispensa checar o título.
 *   - YouTube: não tem campo de "jogo" para lives — verifica palavras-chave no
 *     título/descrição.
 * Caso ambíguo (sem correspondência clara): não notifica — mais conservador do
 * que arriscar notificar uma live de outro conteúdo.
 */

const TITLE_KEYWORDS = [
  'project zomboid',
  'zomboid',
  'brasileirão',
  'brasileirao',
  '#brasileiraopz',
  'campeonato brasileiro',
  'pz rank',
  'pzrank',
];

export function isChampionshipTitle(title: string, description?: string | null): boolean {
  const text = `${title} ${description ?? ''}`.toLowerCase();
  return TITLE_KEYWORDS.some(k => text.includes(k));
}

export function isChampionshipTwitchGame(game: string | null): boolean {
  return !!game && game.trim().toLowerCase() === 'project zomboid';
}

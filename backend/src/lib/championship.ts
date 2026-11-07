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

// Apenas termos que identificam especificamente ESTE campeonato — nunca "zomboid"/
// "project zomboid" puros. Um streamer pode jogar Project Zomboid em qualquer outro
// desafio/formato (ex: "Legendoid Challenge x16 True Zero to Hero", que não tem
// nenhuma relação com o Brasileirão) e a descrição de praticamente toda live de PZ
// já cita o nome do jogo — um keyword genérico do jogo deixa o filtro inútil pro
// próprio propósito dele (ver bug relatado: live de outro desafio foi notificada
// só por mencionar "zomboid" na descrição).
const TITLE_KEYWORDS = [
  'brasileirão',
  'brasileirao',
  '#brasileiraopz',
  'campeonato brasileiro',
  'pz rank',
  'pzrank',
];

// Campeonatos de terceiros que copiam o nosso formato (ChallengeZ, 11/2026): live que os
// cita nunca é anunciada, mesmo de jogador nosso e mesmo citando também o Brasileirão.
// "challenge z" / "challenge-z" / "#challengez" / "challengez.online"; o \b depois do z
// evita casar com "challenge zombie".
const RIVAL_PATTERNS: RegExp[] = [
  /\bchallenge[\s._-]*z\b/i,
];

export function isRivalChampionshipContent(title: string | null | undefined, description?: string | null): boolean {
  const text = `${title ?? ''} ${description ?? ''}`;
  return RIVAL_PATTERNS.some(re => re.test(text));
}

export function isChampionshipTitle(title: string, description?: string | null): boolean {
  if (isRivalChampionshipContent(title, description)) return false;
  const text = `${title} ${description ?? ''}`.toLowerCase();
  return TITLE_KEYWORDS.some(k => text.includes(k));
}

export function isChampionshipTwitchGame(game: string | null): boolean {
  return !!game && game.trim().toLowerCase() === 'project zomboid';
}

/** Twitch: categoria Project Zomboid e título sem campeonato de terceiros. */
export function isChampionshipTwitchLive(game: string | null, title: string | null | undefined): boolean {
  return isChampionshipTwitchGame(game) && !isRivalChampionshipContent(title);
}

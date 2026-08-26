/**
 * Twitch — verificação de live por login de canal, sem app registrado
 *
 * Usa a API GraphQL interna que o próprio site twitch.tv consome
 * (gql.twitch.tv), com o Client-Id público do frontend oficial da Twitch
 * (kimne78kx3ncx6brgo4mv6wki5h1ko — o mesmo usado por Streamlink, Chatterino
 * e diversos bots open-source para essa finalidade). Não requer cadastro de
 * app nem OAuth.
 *
 * Risco: é uma API não-documentada/não-oficial — a Twitch pode alterar o
 * schema ou bloquear esse Client-Id sem aviso prévio. Na prática é estável
 * há anos por ser usada amplamente pelo ecossistema, mas não há garantia
 * contratual como na Helix oficial.
 */

const TWITCH_GQL_URL       = 'https://gql.twitch.tv/gql';
const TWITCH_GQL_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const BATCH_SIZE           = 50; // aliases por request — margem segura sob o limite de complexidade do GQL

/**
 * Extrai o login (username) de uma URL da Twitch.
 * Suporta twitch.tv/nome, www.twitch.tv/nome, com ou sem protocolo.
 */
export function extractTwitchLogin(url: string): string | null {
  const normalized = url.trim().replace(/\/$/, '');
  const match = normalized.match(/twitch\.tv\/([a-zA-Z0-9_]{2,25})(?:[/?#]|$)/i);
  return match ? match[1].toLowerCase() : null;
}

export interface TwitchLiveResult {
  id:        string;
  login:     string;
  title:     string;
  thumbnail: string;
  game:      string | null;
}

interface GqlUserNode {
  login:  string;
  stream: { id: string; type: string; title: string; previewImageURL: string; game: { name: string } | null } | null;
}

export interface TwitchLiveCheckResult {
  /** Canais confirmados ao vivo agora. */
  live: Map<string, TwitchLiveResult>;
  /**
   * Logins (lowercase) cujo lote falhou (erro de rede, timeout, resposta não-ok
   * ou GraphQL sem `data`) — checagem INCONCLUSIVA, não confirma que o canal
   * está offline. Quem chama esta função NUNCA deve tratar um login aqui como
   * "não está ao vivo": essa API não-oficial falha esporadicamente, e se um
   * falso "offline" limpar o estado de "já notificado" (ex: twitch_last_live_id),
   * a próxima checagem bem-sucedida vê a mesma live como "nova" e duplica a
   * notificação no Discord — foi exatamente esse o bug que motivou este campo.
   */
  failed: Set<string>;
}

/**
 * Consulta quais logins estão ao vivo agora via GraphQL (batch por alias, um único
 * POST por lote de até BATCH_SIZE canais).
 */
export async function getLiveStreams(logins: string[]): Promise<TwitchLiveCheckResult> {
  const live   = new Map<string, TwitchLiveResult>();
  const failed = new Set<string>();
  if (logins.length === 0) return { live, failed };

  for (let i = 0; i < logins.length; i += BATCH_SIZE) {
    const batch  = logins.slice(i, i + BATCH_SIZE);
    const fields = batch.map((login, idx) =>
      `u${idx}: user(login: ${JSON.stringify(login)}) { login stream { id type title previewImageURL(width: 440, height: 248) game { name } } }`
    ).join('\n');

    try {
      const res = await fetch(TWITCH_GQL_URL, {
        method:  'POST',
        headers: { 'Client-Id': TWITCH_GQL_CLIENT_ID, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: `query { ${fields} }` }),
        signal:  AbortSignal.timeout(8_000),
      });
      if (!res.ok) { batch.forEach(l => failed.add(l.toLowerCase())); continue; }

      const json = await res.json() as { data?: Record<string, GqlUserNode | null> };
      if (!json.data) { batch.forEach(l => failed.add(l.toLowerCase())); continue; }

      for (const node of Object.values(json.data)) {
        if (!node?.stream || node.stream.type !== 'live') continue;
        live.set(node.login.toLowerCase(), {
          id:        node.stream.id,
          login:     node.login,
          title:     node.stream.title ?? '',
          thumbnail: node.stream.previewImageURL,
          game:      node.stream.game?.name ?? null,
        });
      }
    } catch {
      // falha de rede/timeout — lote inteiro fica inconclusivo, não "offline"
      batch.forEach(l => failed.add(l.toLowerCase()));
    }
  }

  return { live, failed };
}

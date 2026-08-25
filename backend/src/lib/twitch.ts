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
}

interface GqlUserNode {
  login:  string;
  stream: { id: string; type: string; title: string; previewImageURL: string } | null;
}

/**
 * Consulta quais logins estão ao vivo agora via GraphQL (batch por alias, um único
 * POST por lote de até BATCH_SIZE canais). Retorna um Map<login, TwitchLiveResult>
 * apenas com os canais ao vivo.
 */
export async function getLiveStreams(logins: string[]): Promise<Map<string, TwitchLiveResult>> {
  const result = new Map<string, TwitchLiveResult>();
  if (logins.length === 0) return result;

  for (let i = 0; i < logins.length; i += BATCH_SIZE) {
    const batch  = logins.slice(i, i + BATCH_SIZE);
    const fields = batch.map((login, idx) =>
      `u${idx}: user(login: ${JSON.stringify(login)}) { login stream { id type title previewImageURL(width: 440, height: 248) } }`
    ).join('\n');

    try {
      const res = await fetch(TWITCH_GQL_URL, {
        method:  'POST',
        headers: { 'Client-Id': TWITCH_GQL_CLIENT_ID, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: `query { ${fields} }` }),
        signal:  AbortSignal.timeout(8_000),
      });
      if (!res.ok) continue;

      const json = await res.json() as { data?: Record<string, GqlUserNode | null> };
      if (!json.data) continue;

      for (const node of Object.values(json.data)) {
        if (!node?.stream || node.stream.type !== 'live') continue;
        result.set(node.login.toLowerCase(), {
          id:        node.stream.id,
          login:     node.login,
          title:     node.stream.title ?? '',
          thumbnail: node.stream.previewImageURL,
        });
      }
    } catch {
      // best-effort — lote com erro simplesmente não contribui canais "ao vivo"
    }
  }

  return result;
}

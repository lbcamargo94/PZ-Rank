/**
 * YouTube Pub/Sub (WebSub) integration
 *
 * Fluxo:
 * 1. extractChannelId(youtube_url) → UC... channel ID
 * 2. subscribePubSub(channelId)    → inscreve no hub do YouTube
 * 3. Webhook recebe notificações   → verifica se é live via YouTube Data API
 * 4. Cron diário renova inscrições próximas de vencer
 *
 * Env vars necessárias:
 *   YOUTUBE_API_KEY       — YouTube Data API v3 (para verificar se vídeo é live)
 *   PUBSUB_CALLBACK_URL   — URL pública do endpoint: https://api.pzrank.com.br/webhooks/youtube
 *   PUBSUB_SECRET         — segredo HMAC para verificar assinatura das notificações
 */

const PUBSUB_HUB        = 'https://pubsubhubbub.appspot.com/subscribe';
const LEASE_SECONDS     = 864_000; // 10 dias
const FEED_BASE         = 'https://www.youtube.com/feeds/videos.xml?channel_id=';
const YT_API_BASE       = 'https://www.googleapis.com/youtube/v3';

// ── Cota da YouTube Data API ──────────────────────────────────────────────────
// 10.000 unidades/dia, renovadas à meia-noite do Pacífico. Depois de estourar, toda
// chamada volta 403 — em 2026-09 eram ~16 mil chamadas perdidas por dia, e o cron
// que resolve canais marcava links bons como "não encontrado". Ao ver quotaExceeded,
// para de chamar a API até a renovação.
let quotaBlockedUntil = 0;

/** Falhas DEFINITIVAS (canal não existe) antes do cron desistir do link — ver /cron/backfill-yt-subs. */
export const YT_RESOLVE_MAX_ATTEMPTS = 5;

export function isYouTubeQuotaBlocked(now = Date.now()): boolean {
  return now < quotaBlockedUntil;
}

/** Próxima meia-noite em America/Los_Angeles (renovação da cota), +5 min de folga. */
export function nextQuotaReset(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', timeZoneName: 'shortOffset',
  }).formatToParts(now);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0';
  const offH = Number(get('timeZoneName').match(/GMT([+-]\d+)/)?.[1] ?? 0);
  return Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day')) + 1) - offH * 3_600_000 + 5 * 60_000;
}

/** fetch da Data API com o disjuntor de cota. null = bloqueado pela cota (nenhuma chamada feita). */
async function ytApiFetch(url: string): Promise<Response | null> {
  if (isYouTubeQuotaBlocked()) return null;
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (res.status === 403) {
    const body = await res.clone().text().catch(() => '');
    if (/quotaExceeded|dailyLimitExceeded/.test(body)) {
      quotaBlockedUntil = nextQuotaReset();
      console.warn(`[youtube] cota diária esgotada — API pausada até ${new Date(quotaBlockedUntil).toISOString()}`);
    }
  }
  return res;
}

// ── Extração de channel_id ────────────────────────────────────────────────────

/**
 * Extrai o channel_id (UCxxxx) de uma URL do YouTube.
 * Suporta:
 *   - UC... em qualquer lugar da URL (ex: https://UCVIjtLxXgL6uSXRU84pTdBQ)
 *   - youtube.com/channel/UCxxxx
 *   - youtube.com/@handle  /  @handle sem domínio (ex: https://@simbaproduz)
 *   - youtube.com/user/username  (legado)
 *   - youtube.com/c/customname   (legado)
 *   - youtube.com/NAME           (URL curta sem prefixo)
 *   - www.youtube/NAME           (domínio sem .com)
 * (ver resolveChannelId / extractChannelIdViaApi abaixo)
 */
export type ChannelResolution = { id: string } | { notFound: true } | { error: true };

/** Caminho do canal no youtube.com a partir do link cadastrado ('@handle', 'user/x', 'c/x', 'x'). */
export function channelPathOf(url: string): string | null {
  const normalized = url.trim().replace(/[?#].*$/, '').replace(/\/$/, '');
  const bare = normalized.match(/^(?:https?:\/\/)?@([^/?&#\s]+)$/i);
  if (bare) return `@${bare[1]}`;
  if (!/(?:www\.|m\.)?youtube(?:\.com)?\//i.test(normalized)) return null;
  const m = normalized.match(/youtube(?:\.com)?\/+(@[^/?&#\s]+|user\/[^/?&#\s]+|c\/[^/?&#\s]+|[^@/?&#\s]+)$/i);
  return m ? m[1] : null;
}

/**
 * Resolve o canal pela página pública do youtube.com (o link canônico traz o
 * UC... do canal). Não gasta cota da Data API. 'not_found' = página 404.
 */
async function resolveChannelByPage(path: string): Promise<string | 'not_found' | null> {
  try {
    const url = 'https://www.youtube.com/' + path.split('/').map(encodeURIComponent).join('/');
    const res = await fetch(url, {
      signal:  AbortSignal.timeout(8_000),
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en', Cookie: 'CONSENT=YES+1' },
    });
    if (res.status === 404) return 'not_found';
    if (!res.ok) return null;
    const html = await res.text();
    return html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/)?.[1]
      ?? html.match(/"externalId":"(UC[\w-]{22})"/)?.[1]
      ?? null;
  } catch (err) {
    console.warn('[resolveChannelByPage] erro:', path, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Resolve o channel_id distinguindo "não existe" (link quebrado — conta tentativa)
 * de "não deu pra saber agora" (rede, cota — tenta de novo depois sem penalizar).
 * Ordem: UC no link → página pública (sem cota) → Data API (com cota).
 */
export async function resolveChannelId(url: string): Promise<ChannelResolution> {
  const uc = url.match(/(UC[\w-]{22})/);
  if (uc) return { id: uc[1] };
  const path = channelPathOf(url);
  if (!path) return { notFound: true };   // nem é link de canal do YouTube

  const page = await resolveChannelByPage(path);
  if (page && page !== 'not_found') return { id: page };
  // Página 404 de @handle é definitivo — a API diria o mesmo, não gasta cota
  if (page === 'not_found' && path.startsWith('@')) return { notFound: true };

  const viaApi = await extractChannelIdViaApi(url);
  if (viaApi) return { id: viaApi };
  if (page === null && (isYouTubeQuotaBlocked() || !process.env.YOUTUBE_API_KEY)) return { error: true };
  return { notFound: true };
}

/** Compat: channel_id ou null (sem distinguir o motivo). */
export async function extractChannelId(url: string): Promise<string | null> {
  const r = await resolveChannelId(url);
  return 'id' in r ? r.id : null;
}

async function extractChannelIdViaApi(url: string): Promise<string | null> {
  const normalized = url.trim().replace(/\/$/, '');

  // UC... channel ID em qualquer lugar da string (ex: https://UCVIjtLxXgL6uSXRU84pTdBQ)
  const ucAnywhere = normalized.match(/(UC[\w-]{22})/);
  if (ucAnywhere) return ucAnywhere[1];

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  // @handle sem domínio YouTube (ex: https://@simbaproduz  ou  @simbaproduz)
  // [^/?&#\s]+ captura handles com caracteres Unicode (ex: @carniçagames666, @vídeos)
  const bareHandle = normalized.match(/^(?:https?:\/\/)?@([^/?&#\s]+)$/i);
  if (bareHandle) {
    const byHandle = await resolveChannelByHandle(`@${bareHandle[1]}`, apiKey);
    if (byHandle) return byHandle;
    return resolveChannelBySearch(bareHandle[1], apiKey);
  }

  // Domínio tolerante: youtube.com ou www.youtube (sem .com)
  const isYoutube = /(?:www\.)?youtube(?:\.com)?\//i.test(normalized);
  if (!isYoutube) return null;

  // @handle → channels.list?forHandle
  const handleMatch = normalized.match(/youtube(?:\.com)?\/+@([^/?&#\s]+)/i);
  if (handleMatch) return resolveChannelByHandle(`@${handleMatch[1]}`, apiKey);

  // /user/username (legado)
  const userMatch = normalized.match(/youtube(?:\.com)?\/+user\/([^/?&#\s]+)/i);
  if (userMatch) return resolveChannelByUsername(userMatch[1], apiKey);

  // /c/customname (legado)
  const customMatch = normalized.match(/youtube(?:\.com)?\/+c\/([^/?&#\s]+)/i);
  if (customMatch) return resolveChannelBySearch(customMatch[1], apiKey);

  // youtube.com/NAME — URL curta sem prefixo (ex: youtube.com/BoneYT)
  const bareMatch = normalized.match(/youtube(?:\.com)?\/+([^@/?&#\s]+)$/i);
  if (bareMatch) {
    const name = bareMatch[1];
    const byHandle = await resolveChannelByHandle(`@${name}`, apiKey);
    if (byHandle) return byHandle;
    return resolveChannelBySearch(name, apiKey);
  }

  return null;
}

async function resolveChannelByHandle(handle: string, apiKey: string): Promise<string | null> {
  try {
    const url = `${YT_API_BASE}/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
    const res  = await ytApiFetch(url);
    if (!res) return null;
    if (!res.ok) { console.warn('[resolveChannelByHandle] API erro:', res.status, handle); return null; }
    const json = await res.json() as { items?: Array<{ id: string }> };
    return json.items?.[0]?.id ?? null;
  } catch (err) { console.error('[resolveChannelByHandle] erro:', handle, err); return null; }
}

async function resolveChannelByUsername(username: string, apiKey: string): Promise<string | null> {
  try {
    const url = `${YT_API_BASE}/channels?part=id&forUsername=${encodeURIComponent(username)}&key=${apiKey}`;
    const res  = await ytApiFetch(url);
    if (!res) return null;
    if (!res.ok) { console.warn('[resolveChannelByUsername] API erro:', res.status, username); return null; }
    const json = await res.json() as { items?: Array<{ id: string }> };
    return json.items?.[0]?.id ?? null;
  } catch (err) { console.error('[resolveChannelByUsername] erro:', username, err); return null; }
}

async function resolveChannelBySearch(name: string, apiKey: string): Promise<string | null> {
  try {
    const url = `${YT_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(name)}&maxResults=1&key=${apiKey}`;
    const res  = await ytApiFetch(url);
    if (!res) return null;
    if (!res.ok) { console.warn('[resolveChannelBySearch] API erro:', res.status, name); return null; }
    const json = await res.json() as { items?: Array<{ snippet: { channelId: string } }> };
    return json.items?.[0]?.snippet?.channelId ?? null;
  } catch (err) { console.error('[resolveChannelBySearch] erro:', name, err); return null; }
}

// ── Verificação manual de live por canal ─────────────────────────────────────

export interface ChannelLiveResult {
  videoId:  string;
  videoUrl: string;
  title:    string;
  description: string;
  thumbnail: string;
}

/**
 * Verifica se um canal está ao vivo agora.
 * Estratégia sem quota: busca o vídeo mais recente via RSS (gratuito),
 * depois confirma se está ao vivo via videos.list (1 unidade de quota).
 */
export async function getChannelCurrentLive(channelId: string): Promise<ChannelLiveResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const feedUrl = `${FEED_BASE}${channelId}`;
    const feedRes = await fetch(feedUrl, { signal: AbortSignal.timeout(5_000) });
    if (!feedRes.ok) return null;

    const xml = await feedRes.text();

    // O feed Atom do YouTube tem <published> na raiz (data de criação do canal)
    // e dentro de cada <entry> (data real do vídeo). Extraímos do primeiro <entry>
    // para não confundir a data do canal (que pode ter anos) com a do vídeo.
    const entryXml = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1] ?? '';
    const videoId  = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    if (!videoId) return null;

    // Economiza quota: só chama a API se o vídeo foi publicado nas últimas 12h.
    // Vídeos mais antigos que 12h nunca são lives ativas no momento da checagem.
    const published = entryXml.match(/<published>([^<]+)<\/published>/)?.[1];
    if (published) {
      const ageMs = Date.now() - new Date(published).getTime();
      if (ageMs > 12 * 60 * 60 * 1000) return null;
    }

    const liveInfo = await checkIsLive(videoId);
    if (!liveInfo?.isLive) return null;

    return {
      videoId,
      videoUrl:    `https://www.youtube.com/watch?v=${videoId}`,
      title:       liveInfo.title,
      description: liveInfo.description,
      thumbnail:   liveInfo.thumbnail,
    };
  } catch {
    return null;
  }
}

// ── Pub/Sub subscription ──────────────────────────────────────────────────────

export interface SubscribeResult {
  ok:         boolean;
  expiresAt:  string; // ISO timestamp
  error?:     string;
}

export async function subscribePubSub(channelId: string): Promise<SubscribeResult> {
  const callbackUrl = process.env.PUBSUB_CALLBACK_URL;
  if (!callbackUrl) {
    return { ok: false, expiresAt: '', error: 'PUBSUB_CALLBACK_URL não configurada' };
  }

  const topic = `${FEED_BASE}${channelId}`;
  const body  = new URLSearchParams({
    'hub.callback':       callbackUrl,
    'hub.mode':           'subscribe',
    'hub.topic':          topic,
    'hub.verify':         'async',
    'hub.lease_seconds':  String(LEASE_SECONDS),
    ...(process.env.PUBSUB_SECRET ? { 'hub.secret': process.env.PUBSUB_SECRET } : {}),
  });

  // Timeout curto: chamadas em paralelo, falhas pegam no próximo cron diário.
  try {
    const res = await fetch(PUBSUB_HUB, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
      signal:  AbortSignal.timeout(12_000),
    });

    if (res.status === 202) {
      const expiresAt = new Date(Date.now() + LEASE_SECONDS * 1000).toISOString();
      return { ok: true, expiresAt };
    }

    const text = await res.text().catch(() => '');
    return { ok: false, expiresAt: '', error: `Hub retornou ${res.status}: ${text.slice(0, 200)}` };
  } catch (err) {
    return { ok: false, expiresAt: '', error: String(err) };
  }
}

// ── Verificação HMAC da notificação ──────────────────────────────────────────

export function verifyHmac(rawBody: Buffer, signature: string | undefined): boolean {
  const secret = process.env.PUBSUB_SECRET;
  if (!secret) return true; // sem segredo configurado, aceita tudo

  if (!signature?.startsWith('sha1=')) return false;

  const crypto  = require('node:crypto') as typeof import('node:crypto');
  const digest  = crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
  const trusted = Buffer.from(`sha1=${digest}`);
  const given   = Buffer.from(signature);

  if (trusted.length !== given.length) return false;
  return crypto.timingSafeEqual(trusted, given);
}

// ── Parse do Atom feed (notificação Pub/Sub) ──────────────────────────────────

export interface PubSubEntry {
  videoId:   string;
  channelId: string;
  title:     string;
  videoUrl:  string;
}

export function parsePubSubAtom(xml: string): PubSubEntry | null {
  const videoId   = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
  const channelId = xml.match(/<yt:channelId>([^<]+)<\/yt:channelId>/)?.[1];
  const title     = xml.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
  const videoUrl  = xml.match(/<link rel="alternate" href="([^"]+)"/)?.[1];

  if (!videoId || !channelId || !videoUrl) return null;
  return { videoId, channelId, title: title ?? '', videoUrl };
}

// ── Verificação se vídeo está ao vivo (YouTube Data API) ─────────────────────

// Teto de segurança: se uma live nunca é reconfirmada de forma confiável (checagem
// real, não "modo degradado") dentro desse intervalo, o chamador deve tratá-la como
// encerrada e limpar o estado, mesmo que a checagem continue falhando/indisponível.
// 12h cobre folgadamente qualquer transmissão real do desafio.
export const YT_LIVE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export interface LiveInfo {
  isLive:      boolean;
  title:       string;
  description: string;
  thumbnail:   string;
  /** true = isLive é um palpite (sem API key configurada), não uma confirmação real —
   *  chamadores não devem usar isLive:true aqui pra renovar timers de confiança
   *  (ver YT_LIVE_MAX_AGE_MS), só pra manter o comportamento de dev sem quebrar. */
  degraded?: boolean;
}

export async function checkIsLive(videoId: string): Promise<LiveInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Sem API key: assume que qualquer notificação é live (modo degradado)
    return { isLive: true, title: '', description: '', thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, degraded: true };
  }

  try {
    const url = `${YT_API_BASE}/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${apiKey}`;
    const res  = await ytApiFetch(url);
    if (!res) return null;   // cota esgotada: incerteza, igual a falha de API
    if (!res.ok) {
      console.warn('[checkIsLive] YouTube API erro:', res.status);
      return null;
    }

    const json = await res.json() as {
      items?: Array<{
        snippet: {
          title: string;
          description?: string;
          liveBroadcastContent: string;
          thumbnails: { maxres?: { url: string }; high?: { url: string } };
        };
        liveStreamingDetails?: { actualStartTime?: string; actualEndTime?: string };
      }>;
    };

    const item = json.items?.[0];
    if (!item) {
      // Vídeo não existe mais (deletado/privado) — diferente de falha de API: isso é
      // um sinal definitivo de "não está ao vivo", não uma incerteza transitória.
      // Retornar null aqui faria os chamadores nunca limparem yt_last_live_video_id
      // (todos tratam null como "mantém estado anterior" para não descartar por
      // instabilidade momentânea da API).
      console.warn('[checkIsLive] vídeo não encontrado (provavelmente deletado/privado):', videoId);
      return { isLive: false, title: '', description: '', thumbnail: '' };
    }

    const details = item.liveStreamingDetails;
    // liveBroadcastContent === 'live' é o sinal mais confiável — atualizado antes de actualStartTime
    const isLive = item.snippet.liveBroadcastContent === 'live'
                || (!!details?.actualStartTime && !details?.actualEndTime);

    const title       = item.snippet.title;
    const description = item.snippet.description ?? '';
    const thumbnail   = item.snippet.thumbnails.maxres?.url
                     ?? item.snippet.thumbnails.high?.url
                     ?? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    console.log('[checkIsLive]', { videoId, liveBroadcastContent: item.snippet.liveBroadcastContent, isLive });
    return { isLive, title, description, thumbnail };
  } catch (err) {
    console.error('[checkIsLive] erro:', err);
    return null;
  }
}

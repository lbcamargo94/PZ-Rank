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
 */
export async function extractChannelId(url: string): Promise<string | null> {
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
    const res  = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) { console.warn('[resolveChannelByHandle] API erro:', res.status, handle); return null; }
    const json = await res.json() as { items?: Array<{ id: string }> };
    return json.items?.[0]?.id ?? null;
  } catch (err) { console.error('[resolveChannelByHandle] erro:', handle, err); return null; }
}

async function resolveChannelByUsername(username: string, apiKey: string): Promise<string | null> {
  try {
    const url = `${YT_API_BASE}/channels?part=id&forUsername=${encodeURIComponent(username)}&key=${apiKey}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) { console.warn('[resolveChannelByUsername] API erro:', res.status, username); return null; }
    const json = await res.json() as { items?: Array<{ id: string }> };
    return json.items?.[0]?.id ?? null;
  } catch (err) { console.error('[resolveChannelByUsername] erro:', username, err); return null; }
}

async function resolveChannelBySearch(name: string, apiKey: string): Promise<string | null> {
  try {
    const url = `${YT_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(name)}&maxResults=1&key=${apiKey}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8_000) });
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

    const xml     = await feedRes.text();
    const videoId = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    if (!videoId) return null;

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

  try {
    const res = await fetch(PUBSUB_HUB, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
      signal:  AbortSignal.timeout(10_000),
    });

    if (res.status === 202) {
      // 202 Accepted = hub recebeu e vai confirmar de forma assíncrona
      const expiresAt = new Date(Date.now() + LEASE_SECONDS * 1000).toISOString();
      return { ok: true, expiresAt };
    }

    const text = await res.text().catch(() => '');
    return { ok: false, expiresAt: '', error: `Hub retornou ${res.status}: ${text}` };
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
    const res  = await fetch(url, { signal: AbortSignal.timeout(8_000) });
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

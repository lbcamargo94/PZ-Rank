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
 *   - youtube.com/channel/UCxxxx
 *   - youtube.com/@handle
 *   - youtube.com/user/username  (legado)
 *   - youtube.com/c/customname   (legado)
 */
export async function extractChannelId(url: string): Promise<string | null> {
  const normalized = url.trim().replace(/\/$/, '');

  // Formato direto: /channel/UCxxxx
  const directMatch = normalized.match(/youtube\.com\/channel\/(UC[\w-]{20,})/i);
  if (directMatch) return directMatch[1];

  // Formato @handle, /user/, /c/ — resolve fazendo fetch da página
  const isHandle = /youtube\.com\/(@[\w.-]+|user\/[\w.-]+|c\/[\w.-]+)/i.test(normalized);
  if (!isHandle) return null;

  try {
    const res = await fetch(normalized, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PZRankBot/1.0)' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // YouTube embute o channel_id na página como "channelId":"UCxxxxxx"
    const match = html.match(/"channelId":"(UC[\w-]{20,})"/);
    return match ? match[1] : null;
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

export interface LiveInfo {
  isLive:    boolean;
  title:     string;
  thumbnail: string;
}

export async function checkIsLive(videoId: string): Promise<LiveInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Sem API key: assume que qualquer notificação é live (modo degradado)
    return { isLive: true, title: '', thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` };
  }

  try {
    const url = `${YT_API_BASE}/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${apiKey}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const json = await res.json() as {
      items?: Array<{
        snippet: { title: string; thumbnails: { maxres?: { url: string }; high?: { url: string } } };
        liveStreamingDetails?: { actualStartTime?: string; actualEndTime?: string };
      }>;
    };

    const item = json.items?.[0];
    if (!item) return null;

    const details   = item.liveStreamingDetails;
    const isLive    = !!details?.actualStartTime && !details?.actualEndTime;
    const title     = item.snippet.title;
    const thumbnail = item.snippet.thumbnails.maxres?.url
                   ?? item.snippet.thumbnails.high?.url
                   ?? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return { isLive, title, thumbnail };
  } catch {
    return null;
  }
}

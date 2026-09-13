/**
 * Discord webhook — notificação de início de live, morte e desclassificação de jogador
 *
 * Env vars:
 *   DISCORD_WEBHOOK_URL       — webhook do canal de lives
 *   DISCORD_DEATH_WEBHOOK_URL — webhook do canal de mortes (usa DISCORD_WEBHOOK_URL se não definida)
 *   DISCORD_DISQ_WEBHOOK_URL  — webhook do canal de desclassificações
 */

const DEATH_CAUSE_PT: Record<string, string> = {
  zombie:       'Zumbi',
  zombie_horde: 'Horda de zumbis',
  zombie_virus: 'Vírus zumbi',
  vehicle:      'Acidente de veículo',
  pvp:          'Morto por outro sobrevivente',
  burned:       'Queimado',
  bled:         'Sangramento',
  infection:    'Infecção na ferida',
  bleach:       'Ingeriu água sanitária',
  poison:       'Envenenamento',
  fall:         'Queda fatal',
  cold:         'Hipotermia',
  sick:         'Doença',
  hunger:       'Inanição',
  thirst:       'Desidratação',
};

function fmtDeathCause(raw: string | null): string | null {
  if (!raw) return null;
  return DEATH_CAUSE_PT[raw] ?? raw;
}

export interface DeathNotificationPayload {
  nick:        string;
  characterName: string;
  profession:  string | null;
  days:        number;
  timeStr:     string;
  kills:       number;
  score:       number;
  rank:        number | null;
  deathCause:  string | null;
}

export async function sendDeathNotification(payload: DeathNotificationPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_DEATH_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const { nick, characterName, profession, days, timeStr, kills, score, rank, deathCause } = payload;

  const fields: { name: string; value: string; inline: boolean }[] = [
    { name: 'Sobrevivência', value: timeStr || `${days}d`,                         inline: true },
    { name: 'Zumbis mortos', value: kills.toLocaleString('pt-BR'),                  inline: true },
    { name: 'Pontuação',     value: score.toLocaleString('pt-BR') + ' pts',         inline: true },
  ];
  if (rank !== null)  fields.push({ name: 'Posição no rank', value: `#${rank}`,   inline: true });
  if (profession)     fields.push({ name: 'Profissão',        value: profession,   inline: true });
  const causeLabel = fmtDeathCause(deathCause);
  if (causeLabel)    fields.push({ name: 'Causa da morte',   value: causeLabel,   inline: false });

  const body = {
    embeds: [{
      title:       `💀  ${nick} morreu!`,
      description: `**${characterName}** não sobreviveu ao apocalipse.`,
      color:       0x2C2F33,
      fields,
      footer:      { text: 'PZ Rank • Brasileirão de Sobrevivência' },
      timestamp:   new Date().toISOString(),
    }],
  };

  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(8_000),
    });
    if (!res.ok) console.error('[discord] death webhook retornou', res.status, 'para:', nick);
    else console.log('[discord] notificação de morte enviada para:', nick);
  } catch (err) {
    console.error('[discord] falha ao enviar notificação de morte:', err);
  }
}

export interface LiveNotificationPayload {
  nick:      string;
  title:     string;
  videoUrl:  string;
  thumbnail: string;
  rank:      number | null;
  score:     number | null;
  platform?: 'youtube' | 'twitch'; // default 'youtube' — mantém o embed atual quando omitido
}

const PLATFORM_STYLE = {
  youtube: { color: 0xE04040, label: 'YouTube' }, // vermelho vivo
  twitch:  { color: 0x9147FF, label: 'Twitch'  }, // roxo da marca
} as const;

export async function sendLiveNotification(payload: LiveNotificationPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[discord] DISCORD_WEBHOOK_URL não configurada — notificação descartada para:', payload.nick);
    return;
  }

  const { nick, title, videoUrl, thumbnail, rank, score, platform = 'youtube' } = payload;
  const style = PLATFORM_STYLE[platform];

  const fields = [];
  if (rank !== null)  fields.push({ name: 'Posição no Rank', value: `#${rank}`,                              inline: true });
  if (score !== null) fields.push({ name: 'Pontuação',        value: score.toLocaleString('pt-BR') + ' pts', inline: true });

  const body = {
    embeds: [{
      title:       `🔴  ${nick} está AO VIVO na ${style.label}!`,
      description: title || 'Project Zomboid — Brasileirão de Sobrevivência',
      url:         videoUrl,
      color:       style.color,
      thumbnail:   { url: thumbnail },
      fields,
      footer: {
        text: 'PZ Rank • Brasileirão de Sobrevivência',
      },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      console.log('[discord] Notificação de início enviada para:', payload.nick);
    } else {
      console.error('[discord] Webhook retornou', res.status, 'para:', payload.nick);
    }
  } catch (err) {
    console.error('[discord] Falha ao enviar notificação:', err);
  }
}

// Traduz o disqualification_reason bruto (ver backend/src/routes/sync.ts e os
// parsers equivalentes no frontend) para um texto legivel no embed do Discord.
function formatDisqReason(reason: string): string {
  if (reason.startsWith('blocked_mod:')) {
    const [name, modId] = reason.slice('blocked_mod:'.length).split('::');
    if (!name) return 'Mod bloqueado detectado';
    return `Mod bloqueado: ${modId ? `${name} (${modId})` : name}`;
  }
  if (reason.startsWith('unlisted_mods:')) {
    const ids = reason.slice('unlisted_mods:'.length).split(',').map(v => v.trim()).filter(Boolean);
    return ids.length > 0 ? `Mod(s) não cadastrado(s): ${ids.join(', ')}` : 'Mod(s) não cadastrado(s) no site';
  }
  if (reason.startsWith('mods:')) return 'Uso de mods não permitidos';
  switch (reason) {
    case 'sandbox': return 'Configuração de sandbox divergente do preset oficial';
    case 'debug':   return 'Modo debug ativado durante o desafio';
    case 'manual':  return 'Desclassificação manual por um moderador';
    default:        return reason;
  }
}

export interface DisqualificationNotificationPayload {
  nick:          string;
  characterName: string;
  reason:        string;         // disqualification_reason bruto — formatado aqui via formatDisqReason
  note?:         string | null;  // nota livre do moderador (desclassificação manual)
  moderator?:    string | null;  // login do moderador (desclassificação manual)
}

export async function sendDisqualificationNotification(payload: DisqualificationNotificationPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_DISQ_WEBHOOK_URL;
  if (!webhookUrl) return;

  const { nick, characterName, reason, note, moderator } = payload;

  const fields: { name: string; value: string; inline: boolean }[] = [
    { name: 'Motivo', value: formatDisqReason(reason), inline: false },
  ];
  if (note?.trim())      fields.push({ name: 'Detalhes',   value: note.trim(),      inline: false });
  if (moderator?.trim()) fields.push({ name: 'Moderador',  value: moderator.trim(), inline: true  });

  const body = {
    embeds: [{
      title:       `🚫  ${nick} foi desclassificado!`,
      description: `**${characterName}** foi removido do Ranking do Brasileirão.`,
      color:       0xE04040,
      fields,
      footer:    { text: 'PZ Rank • Brasileirão de Sobrevivência' },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(8_000),
    });
    if (res.ok) console.log('[discord] notificação de desclassificação enviada para:', nick);
    else console.error('[discord] disq webhook retornou', res.status, 'para:', nick);
  } catch (err) {
    console.error('[discord] falha ao enviar notificação de desclassificação:', err);
  }
}


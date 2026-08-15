/**
 * Discord webhook — notificação de início de live e morte de jogador
 *
 * Env vars:
 *   DISCORD_WEBHOOK_URL       — webhook do canal de lives
 *   DISCORD_DEATH_WEBHOOK_URL — webhook do canal de mortes (usa DISCORD_WEBHOOK_URL se não definida)
 */

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
  if (deathCause)     fields.push({ name: 'Causa da morte',   value: deathCause,   inline: false });

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
}

export async function sendLiveNotification(payload: LiveNotificationPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[discord] DISCORD_WEBHOOK_URL não configurada — notificação descartada para:', payload.nick);
    return;
  }

  const { nick, title, videoUrl, thumbnail, rank, score } = payload;

  const fields = [];
  if (rank !== null)  fields.push({ name: 'Posição no Rank', value: `#${rank}`,                              inline: true });
  if (score !== null) fields.push({ name: 'Pontuação',        value: score.toLocaleString('pt-BR') + ' pts', inline: true });

  const body = {
    embeds: [{
      title:       `🔴  ${nick} está AO VIVO!`,
      description: title || 'Project Zomboid — Brasileirão de Sobrevivência',
      url:         videoUrl,
      color:       0xE04040,  // vermelho vivo
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


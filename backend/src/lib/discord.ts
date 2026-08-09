/**
 * Discord webhook — notificações de live (início e encerramento)
 *
 * Env vars:
 *   DISCORD_WEBHOOK_URL — URL completa do webhook do canal do Discord
 */

export interface LiveNotificationPayload {
  nick:      string;
  title:     string;
  videoUrl:  string;
  thumbnail: string;
  rank:      number | null;
  score:     number | null;
}

export interface LiveEndedPayload {
  nick:     string;
  videoUrl: string;
  rank:     number | null;
  score:    number | null;
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

export async function sendLiveEndedNotification(payload: LiveEndedPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[discord] DISCORD_WEBHOOK_URL não configurada — encerramento descartado para:', payload.nick);
    return;
  }

  const { nick, videoUrl, rank, score } = payload;

  const fields = [];
  if (rank !== null)  fields.push({ name: 'Posição no Rank', value: `#${rank}`,                              inline: true });
  if (score !== null) fields.push({ name: 'Pontuação',        value: score.toLocaleString('pt-BR') + ' pts', inline: true });

  const body = {
    embeds: [{
      title:       `⬛  ${nick} encerrou a transmissão`,
      description: 'A live no YouTube foi encerrada.',
      url:         videoUrl,
      color:       0x4A4A4A,
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
      console.log('[discord] Notificação de encerramento enviada para:', nick);
    } else {
      console.error('[discord] Webhook retornou', res.status, 'no encerramento de:', nick);
    }
  } catch (err) {
    console.error('[discord] Falha ao enviar encerramento:', err);
  }
}

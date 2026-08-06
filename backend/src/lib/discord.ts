/**
 * Discord webhook — notificação de live
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

export async function sendLiveNotification(payload: LiveNotificationPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

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
    await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(8_000),
    });
  } catch (err) {
    console.error('[discord] Falha ao enviar notificação:', err);
  }
}

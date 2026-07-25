import { Resend } from 'resend';
import { config } from '../config';

const resend = new Resend(config.resendApiKey);

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Segoe UI',Arial,sans-serif;color:#e0e0e0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#161616;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#1a1a1a;padding:24px 32px;border-bottom:1px solid #2a2a2a;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#4ade80;letter-spacing:1px;">
              &#9760; PZ Community Rank
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#111;padding:16px 32px;border-top:1px solid #2a2a2a;text-align:center;">
            <p style="margin:0;font-size:12px;color:#555;">
              Você recebeu este email porque se cadastrou no PZ Community Rank.<br/>
              Se não foi você, ignore esta mensagem.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, nick: string, token: string): Promise<void> {
  const link = `${config.frontendUrl}/verificar-email?token=${token}`;
  const html = baseTemplate('Verifique seu email — PZ Community Rank', `
    <h2 style="margin:0 0 16px;font-size:22px;color:#fff;">Bem-vindo, ${nick}!</h2>
    <p style="margin:0 0 24px;color:#aaa;line-height:1.6;">
      Seu cadastro foi recebido. Clique no botão abaixo para verificar seu email e ativar sua conta.
      Depois disso, um moderador vai revisar e aprovar sua participação no ranking.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#4ade80;border-radius:6px;padding:14px 28px;">
          <a href="${link}" style="color:#000;font-weight:700;font-size:15px;text-decoration:none;">
            Verificar email
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:#555;">
      Link expira em 24 horas. Se o botão não funcionar, copie e cole no navegador:<br/>
      <a href="${link}" style="color:#4ade80;word-break:break-all;">${link}</a>
    </p>
  `);

  await resend.emails.send({
    from:    config.fromEmail,
    to:      email,
    subject: '✅ Verifique seu email — PZ Community Rank',
    html,
  });
}

export async function sendPasswordResetEmail(email: string, nick: string, token: string): Promise<void> {
  const link = `${config.frontendUrl}/redefinir-senha?token=${token}`;
  const html = baseTemplate('Redefinir senha — PZ Community Rank', `
    <h2 style="margin:0 0 16px;font-size:22px;color:#fff;">Redefinir senha</h2>
    <p style="margin:0 0 24px;color:#aaa;line-height:1.6;">
      Recebemos uma solicitação de redefinição de senha para a conta <strong>${nick}</strong>.
      Clique no botão abaixo para criar uma nova senha.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#facc15;border-radius:6px;padding:14px 28px;">
          <a href="${link}" style="color:#000;font-weight:700;font-size:15px;text-decoration:none;">
            Redefinir senha
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:#555;">
      Link expira em 1 hora. Se você não solicitou a redefinição, ignore este email.<br/>
      <a href="${link}" style="color:#facc15;word-break:break-all;">${link}</a>
    </p>
  `);

  await resend.emails.send({
    from:    config.fromEmail,
    to:      email,
    subject: '🔑 Redefinir senha — PZ Community Rank',
    html,
  });
}

export async function sendActivationEmail(email: string, nick: string, token: string): Promise<void> {
  const link = `${config.frontendUrl}/ativar-conta?token=${token}`;
  const html = baseTemplate('Ativar conta — PZ Community Rank', `
    <h2 style="margin:0 0 16px;font-size:22px;color:#fff;">Olá, ${nick}!</h2>
    <p style="margin:0 0 24px;color:#aaa;line-height:1.6;">
      Um moderador do <strong>PZ Community Rank</strong> configurou este email para a sua conta.
      Clique no botão abaixo para definir sua senha e ativar o login no Companion.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#38bdf8;border-radius:6px;padding:14px 28px;">
          <a href="${link}" style="color:#000;font-weight:700;font-size:15px;text-decoration:none;">
            Ativar minha conta
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:#555;">
      Link expira em 48 horas. Se você não esperava este email, pode ignorá-lo com segurança.<br/>
      <a href="${link}" style="color:#38bdf8;word-break:break-all;">${link}</a>
    </p>
  `);

  await resend.emails.send({
    from:    config.fromEmail,
    to:      email,
    subject: '🔑 Ative sua conta — PZ Community Rank',
    html,
  });
}

export async function sendApprovalEmail(email: string, nick: string): Promise<void> {
  const link = config.frontendUrl;
  const html = baseTemplate('Conta aprovada — PZ Community Rank', `
    <h2 style="margin:0 0 16px;font-size:22px;color:#fff;">Sua conta foi aprovada! 🎉</h2>
    <p style="margin:0 0 24px;color:#aaa;line-height:1.6;">
      Parabéns, <strong>${nick}</strong>! Um moderador aprovou sua participação no
      <strong>PZ Community Rank</strong>. Você já pode usar o Companion para sincronizar suas runs.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#4ade80;border-radius:6px;padding:14px 28px;">
          <a href="${link}" style="color:#000;font-weight:700;font-size:15px;text-decoration:none;">
            Ver meu ranking
          </a>
        </td>
      </tr>
    </table>
  `);

  await resend.emails.send({
    from:    config.fromEmail,
    to:      email,
    subject: '🏆 Conta aprovada — PZ Community Rank',
    html,
  });
}

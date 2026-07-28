import { Resend } from 'resend';
import { config } from '../config';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!config.resendApiKey) throw new Error('RESEND_API_KEY não configurada no ambiente.');
    _resend = new Resend(config.resendApiKey);
  }
  return _resend;
}

// SDK v2+ retorna {data, error} em vez de lançar. Esse helper propaga o erro corretamente.
async function sendEmail(params: Parameters<Resend['emails']['send']>[0]): Promise<void> {
  const { error } = await getResend().emails.send(params);
  if (error) throw new Error((error as { message?: string }).message ?? 'Resend: erro desconhecido.');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

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
    <h2 style="margin:0 0 16px;font-size:22px;color:#fff;">Bem-vindo, ${escapeHtml(nick)}!</h2>
    <p style="margin:0 0 24px;color:#aaa;line-height:1.6;">
      Seu cadastro foi recebido. Clique no botão abaixo para verificar seu email e ativar sua conta.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#4ade80;border-radius:6px;">
          <a href="${link}" style="display:block;padding:14px 28px;color:#000;font-weight:700;font-size:15px;text-decoration:none;">
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

  await sendEmail({
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
      Recebemos uma solicitação de redefinição de senha para a conta <strong>${escapeHtml(nick)}</strong>.
      Clique no botão abaixo para criar uma nova senha.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#facc15;border-radius:6px;">
          <a href="${link}" style="display:block;padding:14px 28px;color:#000;font-weight:700;font-size:15px;text-decoration:none;">
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

  await sendEmail({
    from:    config.fromEmail,
    to:      email,
    subject: '🔑 Redefinir senha — PZ Community Rank',
    html,
  });
}

export async function sendActivationEmail(email: string, nick: string, token: string): Promise<void> {
  const link = `${config.frontendUrl}/ativar-conta?token=${token}`;
  const html = baseTemplate('Ativar conta — PZ Community Rank', `
    <h2 style="margin:0 0 16px;font-size:22px;color:#fff;">Olá, ${escapeHtml(nick)}!</h2>
    <p style="margin:0 0 24px;color:#aaa;line-height:1.6;">
      Seu email foi configurado no <strong>PZ Community Rank</strong>.
      Clique no botão abaixo para definir sua senha e ativar o login no Companion.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#38bdf8;border-radius:6px;">
          <a href="${link}" style="display:block;padding:14px 28px;color:#000;font-weight:700;font-size:15px;text-decoration:none;">
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

  await sendEmail({
    from:    config.fromEmail,
    to:      email,
    subject: '🔑 Ative sua conta — PZ Community Rank',
    html,
  });
}

export async function sendOtpEmail(
  email: string,
  nick: string,
  code: string,
  action: 'verify_email' | 'change_email' | 'change_password',
): Promise<void> {
  const subjects: Record<typeof action, string> = {
    verify_email:    'Código de verificação — PZ Community Rank',
    change_email:    'Confirmar novo email — PZ Community Rank',
    change_password: 'Confirmar troca de senha — PZ Community Rank',
  };
  const descs: Record<typeof action, string> = {
    verify_email:    'Use o código abaixo para verificar seu email e ativar sua conta.',
    change_email:    'Use o código abaixo para confirmar a troca de email da sua conta.',
    change_password: 'Use o código abaixo para confirmar a troca de senha da sua conta.',
  };
  const html = baseTemplate(subjects[action], `
    <h2 style="margin:0 0 16px;font-size:22px;color:#fff;">Olá, ${escapeHtml(nick)}!</h2>
    <p style="margin:0 0 24px;color:#aaa;line-height:1.6;">${descs[action]}</p>
    <div style="text-align:center;margin:0 0 24px;padding:28px 20px;background:#0a0a0a;border-radius:8px;border:1px solid #2a2a2a;">
      <p style="margin:0 0 8px;font-size:12px;color:#666;letter-spacing:2px;text-transform:uppercase;">Seu código</p>
      <span style="font-size:44px;font-weight:700;letter-spacing:14px;color:#4ade80;font-family:'Courier New',monospace;">${escapeHtml(code)}</span>
    </div>
    <p style="margin:0;font-size:12px;color:#555;">
      Expira em <strong style="color:#aaa;">10 minutos</strong>. Se não foi você, ignore este email.
    </p>
  `);

  await sendEmail({
    from:    config.fromEmail,
    to:      email,
    subject: `🔐 Código ${code} — PZ Community Rank`,
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
        <td style="background:#4ade80;border-radius:6px;">
          <a href="${link}" style="display:block;padding:14px 28px;color:#000;font-weight:700;font-size:15px;text-decoration:none;">
            Ver meu ranking
          </a>
        </td>
      </tr>
    </table>
  `);

  await sendEmail({
    from:    config.fromEmail,
    to:      email,
    subject: '🏆 Conta aprovada — PZ Community Rank',
    html,
  });
}

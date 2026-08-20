import { prisma } from '../lib/prisma.js';
import { generateResetToken, RESET_TOKEN_TTL_MS } from './resetToken.js';
import { sendEmail } from './email.js';
import { env } from '../config/env.js';

function setPasswordEmailHtml(name: string, link: string, intro: string): string {
  return `
    <p>Olá, <strong>${name}</strong>!</p>
    <p>${intro}</p>
    <p>
      <a href="${link}">Clique aqui para definir sua senha</a>
    </p>
    <p>Este link expira em 48 horas. Se você não esperava este email, ignore-o.</p>
    <p>Atenciosamente,<br/>Equipe Mundo Milhas</p>
  `;
}

/**
 * Issues a "set your password" token for a user and emails the link. Shared
 * by the initial account-creation invite and the self-service "esqueci minha
 * senha" flow — both ultimately land on the same `/definir-senha` page and
 * `POST /auth/set-password` endpoint.
 */
export async function issueSetPasswordEmail(
  userId: string,
  name: string,
  email: string,
  subject: string,
  intro: string
): Promise<void> {
  const { token, tokenHash } = generateResetToken();

  await prisma.user.update({
    where: { id: userId },
    data: {
      password_reset_token_hash: tokenHash,
      password_reset_expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const link = `${env.corsOrigin}/definir-senha?token=${token}`;

  try {
    await sendEmail({ to: email, subject, html: setPasswordEmailHtml(name, link, intro) });
  } catch (err) {
    console.error('[passwordInvite] Falha ao enviar email de definição de senha:', err);
  }
}

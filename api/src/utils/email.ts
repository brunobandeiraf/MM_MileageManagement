import { Resend } from 'resend';
import { env } from '../config/env.js';

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends a transactional email via Resend. Outside production the call is
 * only logged to the console — the Resend API is never hit — so local/dev
 * work doesn't consume the free-tier email quota.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  if (env.nodeEnv !== 'production') {
    console.log(`[email:dev] Para: ${to} | Assunto: ${subject}\n${html}`);
    return;
  }

  const resend = new Resend(env.resendApiKey);
  const { error } = await resend.emails.send({ from: env.resendFromEmail, to, subject, html });

  // The Resend SDK never throws for API-level errors (invalid key, unverified
  // domain, etc.) — it always resolves to { data, error }. Throw explicitly so
  // callers' try/catch (and their logging) actually fires on failure.
  if (error) {
    throw new Error(`Resend error: ${error.name} — ${error.message}`);
  }
}

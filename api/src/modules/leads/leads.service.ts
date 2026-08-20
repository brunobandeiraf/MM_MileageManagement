import { prisma } from '../../lib/prisma.js';
import { sendEmail } from '../../utils/email.js';
import { env } from '../../config/env.js';

export type LeadInput = {
  name: string;
  whatsapp: string;
  email: string;
  monthly_card_spend: string;
  trips_per_year?: string;
};

/**
 * Persists a landing page lead and notifies the admin by email that someone
 * is interested. The notification is best-effort — a failure to send never
 * fails lead creation (the lead is already saved either way).
 */
export async function createLead(data: LeadInput): Promise<{ id: string }> {
  const lead = await prisma.lead.create({ data });

  if (env.adminEmail) {
    try {
      await sendEmail({
        to: env.adminEmail,
        subject: 'Mundo Milhas — novo interessado na gestão de milhas',
        html: `
          <p>Um novo lead chegou pelo site:</p>
          <ul>
            <li><strong>Nome:</strong> ${data.name}</li>
            <li><strong>WhatsApp:</strong> ${data.whatsapp}</li>
            <li><strong>Email:</strong> ${data.email}</li>
            <li><strong>Gasto mensal no cartão:</strong> ${data.monthly_card_spend}</li>
            <li><strong>Viagens por ano:</strong> ${data.trips_per_year ?? 'não informado'}</li>
          </ul>
        `,
      });
    } catch (err) {
      console.error('[leads.service] Falha ao enviar notificação de novo lead:', err);
    }
  }

  return { id: lead.id };
}

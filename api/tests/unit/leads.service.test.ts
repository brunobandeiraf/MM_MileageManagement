// Feature: mileage-management-system
// Property 29: createLead persiste o lead mesmo se o email de notificação falhar

import fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null }),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    lead: {
      create: vi.fn(),
    },
  },
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const mockEnv: { nodeEnv: string; resendFromEmail: string; adminEmail: string | undefined } = {
  nodeEnv: 'production',
  resendFromEmail: 'noreply@test.com',
  adminEmail: 'admin@test.com',
};

vi.mock('../../src/config/env.js', () => ({
  get env() {
    return mockEnv;
  },
}));

import { createLead } from '../../src/modules/leads/leads.service.js';
import { prisma } from '../../src/lib/prisma.js';

describe('Property 29: createLead sempre persiste o lead, notificação é best-effort', () => {
  beforeEach(() => {
    sendMock.mockClear();
    mockEnv.nodeEnv = 'production';
    mockEnv.adminEmail = 'admin@test.com';
  });

  it('persiste o lead e notifica o admin quando o email funciona', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (email, name) => {
          vi.mocked(prisma.lead.create).mockResolvedValue({ id: 'lead-id' } as any);

          const result = await createLead({
            name,
            whatsapp: '(11) 91234-5678',
            email,
            monthly_card_spend: 'Acima de R$ 50.000',
          });

          expect(result.id).toBe('lead-id');
          expect(sendMock).toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('persiste o lead mesmo quando o envio do email falha', async () => {
    vi.mocked(prisma.lead.create).mockResolvedValue({ id: 'lead-id-2' } as any);
    sendMock.mockResolvedValueOnce({ data: null, error: { name: 'application_error', message: 'boom' } });

    const result = await createLead({
      name: 'Teste',
      whatsapp: '(11) 91234-5678',
      email: 'lead@test.com',
      monthly_card_spend: 'Acima de R$ 50.000',
    });

    expect(result.id).toBe('lead-id-2');
  });

  it('não tenta notificar quando não há ADMIN_EMAIL configurado', async () => {
    mockEnv.adminEmail = undefined;
    vi.mocked(prisma.lead.create).mockResolvedValue({ id: 'lead-id-3' } as any);

    await createLead({
      name: 'Teste',
      whatsapp: '(11) 91234-5678',
      email: 'lead@test.com',
      monthly_card_spend: 'Acima de R$ 50.000',
    });

    expect(sendMock).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null }),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const mockEnv: { nodeEnv: string; resendApiKey: string; resendFromEmail: string } = {
  nodeEnv: 'development',
  resendApiKey: 're_test',
  resendFromEmail: 'noreply@test.com',
};

vi.mock('../../src/config/env.js', () => ({
  get env() {
    return mockEnv;
  },
}));

import { sendEmail } from '../../src/utils/email.js';

describe('sendEmail', () => {
  beforeEach(() => {
    sendMock.mockClear();
    sendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    mockEnv.nodeEnv = 'development';
  });

  it('fora de produção, apenas loga no console e não chama a API do Resend', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await sendEmail({ to: 'user@test.com', subject: 'Assunto', html: '<p>Oi</p>' });

    expect(sendMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it('em produção, chama a API real do Resend', async () => {
    mockEnv.nodeEnv = 'production';

    await sendEmail({ to: 'user@test.com', subject: 'Assunto', html: '<p>Oi</p>' });

    expect(sendMock).toHaveBeenCalledWith({
      from: 'noreply@test.com',
      to: 'user@test.com',
      subject: 'Assunto',
      html: '<p>Oi</p>',
    });
  });

  it('em produção, lança erro quando a API do Resend retorna { error } (SDK não lança sozinho)', async () => {
    mockEnv.nodeEnv = 'production';
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { name: 'validation_error', message: 'API key is invalid' },
    });

    await expect(
      sendEmail({ to: 'user@test.com', subject: 'Assunto', html: '<p>Oi</p>' })
    ).rejects.toThrow(/API key is invalid/);
  });
});

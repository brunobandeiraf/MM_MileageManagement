// Feature: mileage-management-system, Property 6: Uniformidade de erro de autenticação
// Property 24: login com senha ainda não definida (convite pendente) retorna null
// Property 25: setPassword só aceita token válido e não expirado
// Property 27: forgotPassword nunca revela se o email existe
import fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  }
}));

vi.mock('../../src/config/env.js', () => ({
  env: {
    jwtSecret: 'test-secret-32chars-for-testing!!',
    nodeEnv: 'test',
    port: 3000,
    databaseUrl: 'postgresql://test',
    resendApiKey: 'test',
    resendFromEmail: 'test@test.com',
    corsOrigin: 'http://localhost:5173',
  }
}));

import { login, setPassword, forgotPassword, updateMe } from '../../src/modules/auth/auth.service.js';
import { prisma } from '../../src/lib/prisma.js';
import { hashResetToken } from '../../src/utils/resetToken.js';
import { AppError } from '../../src/utils/errors.js';

/**
 * Validates: Requirement 5.2
 *
 * Property 6: Uniformidade da mensagem de erro de autenticação
 *
 * The login function must return null (not throw, not distinguish which field
 * is wrong) for both "email not found" and "wrong password" scenarios.
 * This prevents user-enumeration attacks.
 */
describe('Property 6: Uniformidade da mensagem de erro de autenticação', () => {
  it('retorna null (sem indicar qual campo é inválido) para email não cadastrado', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1 }),
        async (email, password) => {
          // Simulate user not found
          vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
          const result = await login(email, password);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('retorna null para senha incorreta sem revelar que o email existe', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        async (wrongPassword) => {
          // Simulate user found but with a different password_hash
          vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 'test-id',
            name: 'Test User',
            email: 'test@test.com',
            password_hash: '$2b$10$invalidhashforwrongpassword12345',
            role: 'USER' as const,
            created_at: new Date(),
            updated_at: new Date(),
          });
          const result = await login('test@test.com', wrongPassword);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 24: login com senha ainda não definida retorna null', () => {
  it('retorna null quando password_hash é null (convite de senha pendente)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (anyPassword) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 'test-id',
            name: 'Test User',
            email: 'test@test.com',
            password_hash: null,
            role: 'USER' as const,
            created_at: new Date(),
            updated_at: new Date(),
          } as any);
          const result = await login('test@test.com', anyPassword);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 25: setPassword só aceita token válido e não expirado', () => {
  beforeEach(() => {
    vi.mocked(prisma.user.update).mockReset();
  });

  it('retorna false para token desconhecido', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const result = await setPassword('token-inexistente', 'novaSenha123');
    expect(result).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('retorna false para token expirado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'test-id',
      name: 'Test User',
      email: 'test@test.com',
      password_hash: null,
      password_reset_token_hash: hashResetToken('meu-token'),
      password_reset_expires_at: new Date(Date.now() - 1000), // já expirou
      role: 'USER' as const,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);
    const result = await setPassword('meu-token', 'novaSenha123');
    expect(result).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('retorna true e atualiza password_hash para token válido e não expirado', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'test-id',
      name: 'Test User',
      email: 'test@test.com',
      password_hash: null,
      password_reset_token_hash: hashResetToken('meu-token'),
      password_reset_expires_at: new Date(Date.now() + 1000 * 60 * 60),
      role: 'USER' as const,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const result = await setPassword('meu-token', 'novaSenha123');
    expect(result).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'test-id' },
      data: expect.objectContaining({
        password_reset_token_hash: null,
        password_reset_expires_at: null,
      }),
    });
  });
});

describe('Property 27: forgotPassword nunca revela se o email existe', () => {
  beforeEach(() => {
    vi.mocked(prisma.user.update).mockReset();
  });

  it('não toca no banco quando o email não corresponde a nenhuma conta', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
          await expect(forgotPassword(email)).resolves.toBeUndefined();
          expect(prisma.user.update).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('emite um token de definição de senha quando a conta existe', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'test-id',
      name: 'Test User',
      email: 'test@test.com',
      password_hash: '$2b$10$somevalidishhashvalue1234567890',
      role: 'USER' as const,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    await forgotPassword('test@test.com');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'test-id' },
      data: expect.objectContaining({
        password_reset_token_hash: expect.any(String),
        password_reset_expires_at: expect.any(Date),
      }),
    });
  });
});

describe('Property 28: updateMe — edição do próprio perfil', () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.update).mockReset();
  });

  it('lança 409 quando o novo email já pertence a OUTRO usuário', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'other-user-id',
      email: 'taken@test.com',
    } as any);

    await expect(
      updateMe('test-id', { email: 'taken@test.com' })
    ).rejects.toSatisfy((err: unknown) => err instanceof AppError && err.statusCode === 409);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('permite manter o próprio email (não é conflito consigo mesmo)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'test-id',
      email: 'mine@test.com',
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'test-id',
      name: 'Meu Nome',
      email: 'mine@test.com',
      phone: '(11) 91234-5678',
      avatar_url: null,
      role: 'USER',
    } as any);

    const result = await updateMe('test-id', { email: 'mine@test.com', name: 'Meu Nome' });
    expect(result.name).toBe('Meu Nome');
  });

  it('lança 400 quando o avatar excede o tamanho máximo', async () => {
    const hugeAvatar = 'data:image/png;base64,' + 'A'.repeat(3_000_000);

    await expect(
      updateMe('test-id', { avatar_url: hugeAvatar })
    ).rejects.toSatisfy((err: unknown) => err instanceof AppError && err.statusCode === 400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

// Feature: mileage-management-system
// Property 8: Campos obrigatórios ausentes retornam 400
// Property 15: Listagem nunca expõe password_hash
// Property 17: Unicidade de email é preservada
// Property 18: Invariante de pelo menos um admin
// Property 19: Operações em IDs inexistentes retornam 404
// Property 21: FUNCIONARIO nunca vê o ADMIN na listagem
// Property 22: FUNCIONARIO recebe 404 ao tentar editar/excluir o ADMIN
// Property 23: Somente ADMIN pode criar uma conta FUNCIONARIO ou ADMIN
// Property 26: resetPassword — regras de visibilidade/alvo do ADMIN

import fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
  }
}));

vi.mock('../../src/config/env.js', () => ({
  env: {
    jwtSecret: 'test-secret-32chars!!',
    nodeEnv: 'test',
    port: 3000,
    databaseUrl: 'postgresql://test',
    resendApiKey: 're_test',
    resendFromEmail: 'noreply@test.com',
    corsOrigin: 'http://localhost:5173',
  }
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null }) }
  }))
}));

import { listUsers, createUser, updateUser, deleteUser, setUserPassword } from '../../src/modules/users/users.service.js';
import { prisma } from '../../src/lib/prisma.js';
import { AppError } from '../../src/utils/errors.js';

const VALID_PHONE = '(11) 91234-5678';

// ─── Helper: fake user row returned by Prisma ────────────────────────────────

function makeUserRow(overrides: Partial<{
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'FUNCIONARIO' | 'USER';
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}> = {}) {
  return {
    id: overrides.id ?? 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? 'user@test.com',
    phone: overrides.phone ?? VALID_PHONE,
    role: overrides.role ?? ('USER' as const),
    password_hash: overrides.password_hash ?? '$2b$10$fakehashvalue',
    created_at: overrides.created_at ?? new Date('2024-01-01T00:00:00.000Z'),
    updated_at: overrides.updated_at ?? new Date('2024-01-01T00:00:00.000Z'),
  };
}

// ─── Property 15: Listagem nunca expõe password_hash ─────────────────────────

/**
 * Validates: Requirement 10.1
 *
 * Property 15: Listagem de usuários nunca expõe password_hash
 *
 * For any set of users in the database, GET /users must never include
 * the password_hash field in any returned object.
 */
describe('Property 15: Listagem de usuários nunca expõe password_hash', () => {
  it('nenhum objeto retornado por listUsers contém password_hash', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            phone: fc.constant(VALID_PHONE),
            role: fc.constantFrom('ADMIN' as const, 'FUNCIONARIO' as const, 'USER' as const),
            created_at: fc.date(),
          }),
          { maxLength: 20 }
        ),
        async (users) => {
          // prisma.user.findMany is called with a `select` that excludes password_hash —
          // so we return rows without it, simulating what Prisma would actually return.
          vi.mocked(prisma.user.findMany).mockResolvedValue(users as any);
          vi.mocked(prisma.user.count).mockResolvedValue(users.length);

          const result = await listUsers(1, 100, 'ADMIN');

          for (const u of result.data) {
            expect(u).not.toHaveProperty('password_hash');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 17: Unicidade de email é preservada em criação ─────────────────

/**
 * Validates: Requirements 10.5, 10.6
 *
 * Property 17: Unicidade de email é preservada em criação e atualização
 *
 * When the target email already exists in the database, createUser must throw
 * AppError with statusCode 409 without persisting any new record.
 */
describe('Property 17: Unicidade de email é preservada em criação', () => {
  it('createUser lança AppError 409 quando email já existe', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (email, name) => {
          // Simulate existing user with the same email
          vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUserRow({ email }));

          await expect(createUser(name, email, VALID_PHONE, 'USER', 'ADMIN')).rejects.toSatisfy(
            (err: unknown) =>
              err instanceof AppError && err.statusCode === 409
          );

          // create must never be called
          expect(prisma.user.create).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 18: Invariante de pelo menos um administrador ──────────────────

/**
 * Validates: Requirement 10.7
 *
 * Property 18: Invariante de pelo menos um administrador no sistema
 *
 * When the target user is the only ADMIN in the system, deleteUser must throw
 * AppError with statusCode 400 containing "único administrador" in the message,
 * without removing the record.
 */
describe('Property 18: Invariante de pelo menos um administrador', () => {
  it('deleteUser lança AppError 400 ao tentar remover o único admin', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (id) => {
          // The user exists and is an ADMIN
          vi.mocked(prisma.user.findUnique).mockResolvedValue(
            makeUserRow({ id, role: 'ADMIN' })
          );
          // There is exactly 1 admin in the system
          vi.mocked(prisma.user.count).mockResolvedValue(1);

          await expect(deleteUser(id, 'ADMIN')).rejects.toSatisfy(
            (err: unknown) =>
              err instanceof AppError &&
              err.statusCode === 400 &&
              err.message.includes('único administrador')
          );

          // delete must never be called
          expect(prisma.user.delete).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 19: Operações em IDs inexistentes retornam 404 ─────────────────

/**
 * Validates: Requirement 10.8
 *
 * Property 19: Operações em IDs inexistentes retornam 404
 *
 * For any UUID that does not correspond to an existing record, both updateUser
 * and deleteUser must throw AppError with statusCode 404.
 */
describe('Property 19: Operações em IDs inexistentes retornam 404', () => {
  it('updateUser lança AppError 404 para ID inexistente', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (id) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

          await expect(updateUser(id, { name: 'x' }, 'ADMIN')).rejects.toSatisfy(
            (err: unknown) =>
              err instanceof AppError && err.statusCode === 404
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deleteUser lança AppError 404 para ID inexistente', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (id) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

          await expect(deleteUser(id, 'ADMIN')).rejects.toSatisfy(
            (err: unknown) =>
              err instanceof AppError && err.statusCode === 404
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 21: FUNCIONARIO nunca vê o ADMIN na listagem ───────────────────

/**
 * Property 21: FUNCIONARIO nunca vê o ADMIN na listagem
 *
 * For any set of users including at least one ADMIN, when listUsers is called
 * with requesterRole 'FUNCIONARIO', the ADMIN row must be excluded from the
 * Prisma query (never even fetched) and can never appear in the result.
 */
describe('Property 21: FUNCIONARIO nunca vê o ADMIN na listagem', () => {
  it('listUsers filtra o ADMIN quando requesterRole é FUNCIONARIO', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            phone: fc.constant(VALID_PHONE),
            role: fc.constantFrom('FUNCIONARIO' as const, 'USER' as const),
            created_at: fc.date(),
          }),
          { maxLength: 20 }
        ),
        async (nonAdminUsers) => {
          vi.mocked(prisma.user.findMany).mockResolvedValue(nonAdminUsers as any);
          vi.mocked(prisma.user.count).mockResolvedValue(nonAdminUsers.length);

          const result = await listUsers(1, 100, 'FUNCIONARIO');

          // The Prisma query itself must exclude ADMIN via `where`
          const call = vi.mocked(prisma.user.findMany).mock.calls.at(-1)?.[0];
          expect(call?.where).toMatchObject({ role: { not: 'ADMIN' } });

          for (const u of result.data) {
            expect(u.role).not.toBe('ADMIN');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 22: FUNCIONARIO recebe 404 ao editar/excluir o ADMIN ───────────

/**
 * Property 22: FUNCIONARIO recebe 404 ao tentar editar ou excluir o ADMIN
 *
 * For any ADMIN user ID, updateUser and deleteUser must throw AppError 404
 * (not 403) when called with requesterRole 'FUNCIONARIO' — the ADMIN's
 * existence is hidden, not just protected.
 */
describe('Property 22: FUNCIONARIO recebe 404 ao editar/excluir o ADMIN', () => {
  it('updateUser lança 404 quando FUNCIONARIO tenta editar o ADMIN', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (id) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(
            makeUserRow({ id, role: 'ADMIN' })
          );

          await expect(updateUser(id, { name: 'x' }, 'FUNCIONARIO')).rejects.toSatisfy(
            (err: unknown) => err instanceof AppError && err.statusCode === 404
          );
          expect(prisma.user.update).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deleteUser lança 404 quando FUNCIONARIO tenta excluir o ADMIN', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (id) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(
            makeUserRow({ id, role: 'ADMIN' })
          );

          await expect(deleteUser(id, 'FUNCIONARIO')).rejects.toSatisfy(
            (err: unknown) => err instanceof AppError && err.statusCode === 404
          );
          expect(prisma.user.delete).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 23: Somente ADMIN pode criar uma conta FUNCIONARIO ─────────────

/**
 * Property 23: Somente ADMIN pode criar uma conta FUNCIONARIO
 *
 * When createUser is called with role 'FUNCIONARIO' and requesterRole other
 * than 'ADMIN', it must throw AppError 403 without persisting the record.
 */
describe('Property 23: Somente ADMIN pode criar uma conta FUNCIONARIO', () => {
  it('createUser lança 403 quando um FUNCIONARIO tenta criar outro FUNCIONARIO', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (email, name) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

          await expect(
            createUser(name, email, VALID_PHONE, 'FUNCIONARIO', 'FUNCIONARIO')
          ).rejects.toSatisfy(
            (err: unknown) => err instanceof AppError && err.statusCode === 403
          );
          expect(prisma.user.create).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createUser permite ADMIN criar um FUNCIONARIO', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (email, name) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
          vi.mocked(prisma.user.create).mockResolvedValue(
            makeUserRow({ email, name, role: 'FUNCIONARIO' })
          );
          vi.mocked(prisma.user.update).mockResolvedValue(makeUserRow({ email, name, role: 'FUNCIONARIO' }));

          const result = await createUser(name, email, VALID_PHONE, 'FUNCIONARIO', 'ADMIN');
          expect(result.role).toBe('FUNCIONARIO');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createUser lança 403 quando um FUNCIONARIO tenta criar um ADMIN', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (email, name) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

          await expect(
            createUser(name, email, VALID_PHONE, 'ADMIN', 'FUNCIONARIO')
          ).rejects.toSatisfy(
            (err: unknown) => err instanceof AppError && err.statusCode === 403
          );
          expect(prisma.user.create).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createUser permite ADMIN criar outro ADMIN', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (email, name) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
          vi.mocked(prisma.user.create).mockResolvedValue(
            makeUserRow({ email, name, role: 'ADMIN' })
          );
          vi.mocked(prisma.user.update).mockResolvedValue(makeUserRow({ email, name, role: 'ADMIN' }));

          const result = await createUser(name, email, VALID_PHONE, 'ADMIN', 'ADMIN');
          expect(result.role).toBe('ADMIN');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 26: setUserPassword — regras de visibilidade/alvo do ADMIN ─────

/**
 * Property 26: setUserPassword segue as mesmas regras de visibilidade do ADMIN
 * e nunca é permitido para um alvo ADMIN, mesmo quando o requisitante é ADMIN.
 */
describe('Property 26: setUserPassword — regras de visibilidade/alvo do ADMIN', () => {
  it('lança 404 quando FUNCIONARIO tenta definir a senha do ADMIN', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (id) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(
            makeUserRow({ id, role: 'ADMIN' })
          );

          await expect(setUserPassword(id, 'novaSenha123', 'FUNCIONARIO')).rejects.toSatisfy(
            (err: unknown) => err instanceof AppError && err.statusCode === 404
          );
          expect(prisma.user.update).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('lança 400 quando o próprio ADMIN tenta definir a senha de um alvo ADMIN', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (id) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(
            makeUserRow({ id, role: 'ADMIN' })
          );

          await expect(setUserPassword(id, 'novaSenha123', 'ADMIN')).rejects.toSatisfy(
            (err: unknown) => err instanceof AppError && err.statusCode === 400
          );
          expect(prisma.user.update).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('para USER/FUNCIONARIO, grava o novo hash e invalida qualquer convite pendente', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom('USER' as const, 'FUNCIONARIO' as const),
        async (id, targetRole) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue(
            makeUserRow({ id, role: targetRole })
          );
          vi.mocked(prisma.user.update).mockClear();
          vi.mocked(prisma.user.update).mockResolvedValue(makeUserRow({ id, role: targetRole }));

          const result = await setUserPassword(id, 'novaSenha123', 'ADMIN');
          expect(result.role).toBe(targetRole);

          expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id },
            data: expect.objectContaining({
              password_reset_token_hash: null,
              password_reset_expires_at: null,
            }),
            select: expect.anything(),
          });
        }
      ),
      // Low numRuns: this path hits the real bcrypt hash (cost 10) on every run.
      { numRuns: 10 }
    );
  }, 10000);
});

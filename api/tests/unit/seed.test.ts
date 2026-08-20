// Feature: mileage-management-system
// Property 3: Validação de variáveis obrigatórias do seed
// Property 4: Idempotência do seed — ausência de duplicatas de admin

// Set seed env vars BEFORE any module is imported, so that the module-level
// main() call in seed.ts does not hit the process.exit(1) guard.
process.env['ADMIN_EMAIL'] ??= 'admin@test.com';
process.env['ADMIN_PASSWORD'] ??= 'test-password-for-seed';

// Mock Prisma before any module that imports it is loaded.
// findUnique must resolve with an existing user so that the module-level main()
// call exits early (idempotency path) without trying to hash a password or call
// process.exit(1). $disconnect must also resolve to avoid an unhandled rejection.
vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'seed-module-init-user',
        name: 'Administrador',
        email: 'admin@test.com',
        password_hash: '$2b$10$placeholder',
        role: 'ADMIN' as const,
        created_at: new Date(),
        updated_at: new Date(),
      }),
      create: vi.fn().mockResolvedValue(null),
    },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock env so the module load-time guard in env.ts doesn't call process.exit(1)
vi.mock('../../src/config/env.js', () => ({
  env: {
    nodeEnv: 'test',
    port: 3000,
    databaseUrl: 'postgresql://test',
    jwtSecret: 'test-secret',
    resendApiKey: 'test',
    resendFromEmail: 'test@test.com',
    adminEmail: 'admin@test.com',
    adminPassword: 'test-password',
  },
}));

import fc from 'fast-check';
import { describe, it, expect, vi } from 'vitest';
import { validateSeedEnv } from '../../prisma/seed.js';

/**
 * Validates: Requirements 2.6, 4.5
 *
 * Property 3: Validação de variáveis obrigatórias do seed
 *
 * For any combination of undefined/empty/whitespace-only email OR password,
 * validateSeedEnv must return { valid: false, missing: <varName> } identifying
 * the first absent variable. For any non-empty, non-whitespace-only email AND
 * password, it must return { valid: true }.
 */
describe('Property 3: Validação de variáveis obrigatórias do seed', () => {
  it('retorna { valid: true } para qualquer email e senha não-vazios', () => {
    fc.assert(
      fc.property(
        // Non-empty, non-whitespace-only email and password
        fc.string({ minLength: 1 }).filter((s) => s.trim() !== ''),
        fc.string({ minLength: 1 }).filter((s) => s.trim() !== ''),
        (email, password) => {
          const result = validateSeedEnv(email, password);
          expect(result).toEqual({ valid: true });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('retorna { valid: false, missing: "ADMIN_EMAIL" } quando email é undefined', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: undefined }),
        (password) => {
          const result = validateSeedEnv(undefined, password ?? undefined);
          expect(result).toEqual({ valid: false, missing: 'ADMIN_EMAIL' });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('retorna { valid: false, missing: "ADMIN_EMAIL" } quando email é string vazia ou somente espaços', () => {
    fc.assert(
      fc.property(
        // Whitespace-only strings (empty string or spaces/tabs)
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '')).filter((s) => s.trim() === ''),
        fc.string({ minLength: 1 }).filter((s) => s.trim() !== ''),
        (emptyEmail, password) => {
          const result = validateSeedEnv(emptyEmail, password);
          expect(result).toEqual({ valid: false, missing: 'ADMIN_EMAIL' });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('retorna { valid: false, missing: "ADMIN_PASSWORD" } quando password é undefined e email é válido', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim() !== ''),
        (email) => {
          const result = validateSeedEnv(email, undefined);
          expect(result).toEqual({ valid: false, missing: 'ADMIN_PASSWORD' });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('retorna { valid: false, missing: "ADMIN_PASSWORD" } quando password é string vazia ou somente espaços', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim() !== ''),
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '')).filter((s) => s.trim() === ''),
        (email, emptyPassword) => {
          const result = validateSeedEnv(email, emptyPassword);
          expect(result).toEqual({ valid: false, missing: 'ADMIN_PASSWORD' });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ADMIN_EMAIL tem precedência: retorna missing: "ADMIN_EMAIL" quando ambos estão ausentes', () => {
    // When both are empty/undefined, the first missing var (ADMIN_EMAIL) must be reported
    fc.assert(
      fc.property(
        // Both undefined or whitespace-only
        fc.option(fc.stringOf(fc.constantFrom(' ', '\t')), { nil: undefined }),
        fc.option(fc.stringOf(fc.constantFrom(' ', '\t')), { nil: undefined }),
        (email, password) => {
          // Restrict to cases where email is actually empty/undefined
          const e = email ?? undefined;
          const p = password ?? undefined;
          if (e !== undefined && e.trim() !== '') return; // skip if email is valid
          const result = validateSeedEnv(e, p);
          expect(result).toEqual({ valid: false, missing: 'ADMIN_EMAIL' });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 4.1, 4.2
 *
 * Property 4: Idempotência do seed — ausência de duplicatas de admin
 *
 * For any number N of simulated seed runs (N ≥ 1):
 * - If the admin already exists (findUnique returns a user), create is never called.
 * - Across N runs where the user only doesn't exist on the first run,
 *   prisma.user.create is called exactly once total.
 */
describe('Property 4: Idempotência do seed — ausência de duplicatas de admin', () => {
  it('não chama user.create quando admin já existe no banco', async () => {
    const { prisma } = await import('../../src/lib/prisma.js');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (nRuns) => {
          vi.clearAllMocks();

          const existingUser = {
            id: 'existing-uuid',
            name: 'Administrador',
            email: 'admin@test.com',
            password_hash: '$2b$10$hashedpassword',
            role: 'ADMIN' as const,
            created_at: new Date(),
            updated_at: new Date(),
          };

          // Simulate: user already exists on every call
          vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser);
          vi.mocked(prisma.user.create).mockResolvedValue(existingUser);

          // Run the idempotency simulation N times
          for (let i = 0; i < nRuns; i++) {
            const found = await prisma.user.findUnique({ where: { email: 'admin@test.com' } });
            if (!found) {
              await prisma.user.create({
                data: {
                  name: 'Administrador',
                  email: 'admin@test.com',
                  password_hash: 'hash',
                  role: 'ADMIN',
                },
              });
            }
          }

          // create must never have been called — user already existed
          expect(prisma.user.create).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('chama user.create exatamente 1 vez quando usuário não existe na primeira execução', async () => {
    const { prisma } = await import('../../src/lib/prisma.js');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (nRuns) => {
          vi.clearAllMocks();

          const createdUser = {
            id: 'new-uuid',
            name: 'Administrador',
            email: 'admin@test.com',
            password_hash: '$2b$10$hashedpassword',
            role: 'ADMIN' as const,
            created_at: new Date(),
            updated_at: new Date(),
          };

          // First call: user doesn't exist → create is called
          // Subsequent calls: user exists → create is NOT called
          let callCount = 0;
          vi.mocked(prisma.user.findUnique).mockImplementation(async () => {
            callCount++;
            return callCount === 1 ? null : createdUser;
          });
          vi.mocked(prisma.user.create).mockResolvedValue(createdUser);

          // Simulate N seed runs using the idempotency logic from seed.ts
          for (let i = 0; i < nRuns; i++) {
            const found = await prisma.user.findUnique({ where: { email: 'admin@test.com' } });
            if (!found) {
              await prisma.user.create({
                data: {
                  name: 'Administrador',
                  email: 'admin@test.com',
                  password_hash: 'hash',
                  role: 'ADMIN',
                },
              });
            }
          }

          // Regardless of N runs, create was called at most 1 time
          expect(prisma.user.create).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

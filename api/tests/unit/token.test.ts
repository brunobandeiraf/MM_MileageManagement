// Feature: mileage-management-system, Property 5: JWT de login contém claims corretos
// Feature: mileage-management-system, Property 7: Tokens inválidos são rejeitados
import fc from 'fast-check';
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock env BEFORE importing token.ts
vi.mock('../../src/config/env.js', () => ({
  env: {
    jwtSecret: 'test-secret-for-testing-only-32chars!!',
    nodeEnv: 'test',
    port: 3000,
    databaseUrl: 'postgresql://test',
    resendApiKey: 'test',
    resendFromEmail: 'test@test.com',
  }
}));

import { signToken, verifyToken } from '../../src/utils/token.js';

/**
 * **Validates: Requirements 5.1**
 * Property 5: JWT de login contém claims corretos
 * O token assinado deve conter id, name e role corretos,
 * com expiração de 8h (28800 segundos).
 */
describe('Property 5: JWT de login contém claims corretos', () => {
  it('token assinado contém id, name e role corretos com expiração de 8h', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          role: fc.constantFrom('ADMIN' as const, 'USER' as const),
        }),
        (payload) => {
          const token = signToken(payload);
          const decoded = verifyToken(token);
          expect(decoded.id).toBe(payload.id);
          expect(decoded.name).toBe(payload.name);
          expect(decoded.role).toBe(payload.role);
          // exp - iat should be 8h = 28800 seconds
          expect(decoded.exp - decoded.iat).toBe(28800);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Validates: Requirements 5.4**
 * Property 7: Tokens inválidos são universalmente rejeitados com erro
 * Qualquer string arbitrária que não seja um JWT válido deve lançar erro.
 */
describe('Property 7: Tokens inválidos são universalmente rejeitados com erro', () => {
  it('verifyToken lança erro para qualquer string arbitrária que não seja um JWT válido', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => !s.startsWith('ey')),
        (invalidToken) => {
          expect(() => verifyToken(invalidToken)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: mileage-management-system, Property 2: Hash de senha bcrypt custo 10
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../../src/utils/password.js';

describe('Property 2: Hash de senha tem formato bcrypt com custo mínimo 10', () => {
  it('para qualquer senha válida, hash deve ter formato bcrypt e custo >= 10', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        async (password) => {
          const hash = await hashPassword(password);
          expect(hash).not.toBe(password);
          expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
          const cost = parseInt(hash.split('$')[2], 10);
          expect(cost).toBeGreaterThanOrEqual(10);
        }
      ),
      { numRuns: 10 } // reduced for speed since bcrypt is slow
    );
  });

  it('comparePassword retorna true para senha correta e false para senha incorreta', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        fc.string({ minLength: 1, maxLength: 72 }),
        async (password, wrongPassword) => {
          fc.pre(password !== wrongPassword);
          const hash = await hashPassword(password);
          expect(await comparePassword(password, hash)).toBe(true);
          expect(await comparePassword(wrongPassword, hash)).toBe(false);
        }
      ),
      { numRuns: 5 } // reduced for speed
    );
  });
});

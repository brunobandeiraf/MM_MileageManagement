// Feature: mileage-management-system, Property 1: Variáveis de ambiente obrigatórias são validadas
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { validateEnvVars } from '../../src/config/env.js';

/**
 * Validates: Requirement 2.2
 *
 * IF a required environment variable is absent at startup,
 * THEN the API SHALL terminate with a message identifying by exact name the missing variable.
 *
 * We test the pure helper `validateEnvVars` that encapsulates this logic.
 */

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
] as const;

describe('Property 1: Variáveis de ambiente obrigatórias são validadas na inicialização', () => {
  it('retorna null quando todas as variáveis obrigatórias estão presentes', () => {
    // Generate arbitrary non-empty string values for each required variable.
    // Property: for ANY non-empty string values, validation must pass (return null).
    fc.assert(
      fc.property(
        fc.record({
          DATABASE_URL: fc.string({ minLength: 1 }),
          JWT_SECRET: fc.string({ minLength: 1 }),
          RESEND_API_KEY: fc.string({ minLength: 1 }),
          RESEND_FROM_EMAIL: fc.string({ minLength: 1 }),
        }),
        (vars) => {
          const result = validateEnvVars(vars, REQUIRED_VARS);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('retorna o nome exato da variável ausente quando alguma está faltando', () => {
    // Generate a non-empty subset of REQUIRED_VARS to remove from the env record.
    // Property: for ANY non-empty subset of removed vars, validateEnvVars must return
    // the name of the first removed variable (the one that appears first in REQUIRED_VARS).
    fc.assert(
      fc.property(
        // Base values for all required vars (all non-empty)
        fc.record({
          DATABASE_URL: fc.string({ minLength: 1 }),
          JWT_SECRET: fc.string({ minLength: 1 }),
          RESEND_API_KEY: fc.string({ minLength: 1 }),
          RESEND_FROM_EMAIL: fc.string({ minLength: 1 }),
        }),
        // Pick at least 1 variable to remove
        fc.subarray([...REQUIRED_VARS], { minLength: 1 }),
        (baseVars, missingVars) => {
          const vars: Record<string, string | undefined> = { ...baseVars };

          // Remove the selected variables
          for (const name of missingVars) {
            delete vars[name];
          }

          const result = validateEnvVars(vars, REQUIRED_VARS);

          // Result must be a non-null string
          expect(result).not.toBeNull();

          // Result must be one of the missing variable names
          expect(missingVars).toContain(result);

          // Result must be the FIRST missing variable in REQUIRED_VARS order
          const firstMissing = REQUIRED_VARS.find((v) => missingVars.includes(v));
          expect(result).toBe(firstMissing);
        }
      ),
      { numRuns: 100 }
    );
  });
});

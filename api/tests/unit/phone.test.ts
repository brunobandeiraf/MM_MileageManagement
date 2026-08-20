import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isValidPhone } from '../../src/utils/phone.js';

describe('isValidPhone', () => {
  it('aceita qualquer número no formato (DD) 9XXXX-XXXX', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 11, max: 99 }),
          fc.integer({ min: 0, max: 9999 }),
          fc.integer({ min: 0, max: 9999 })
        ),
        ([ddd, part1, part2]) => {
          const phone = `(${ddd}) 9${part1.toString().padStart(4, '0')}-${part2.toString().padStart(4, '0')}`;
          expect(isValidPhone(phone)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejeita formatos inválidos', () => {
    const invalid = [
      '11912345678',
      '(11) 1234-5678',
      '(1) 91234-5678',
      '(11) 91234-567',
      '(11)91234-5678',
      '',
    ];
    for (const phone of invalid) {
      expect(isValidPhone(phone)).toBe(false);
    }
  });
});

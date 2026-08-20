// Feature: mileage-management-system — Paridade de Transferência (catálogo global, ADMIN)
// Property 39: Um programa não pode ter paridade consigo mesmo
// Property 40: Unicidade do par (from, to) é preservada
// Property 41: Operações em paridades inexistentes retornam 404
// Property 42: Proporção deve ser composta por inteiros positivos
// Property 43: Programas inexistentes são rejeitados com 400

import fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    transferParity: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    loyaltyProgram: {
      findUnique: vi.fn(),
    },
  },
}));

import {
  listTransferParities,
  createTransferParity,
  updateTransferParity,
  deleteTransferParity,
} from '../../src/modules/transferParities/transferParities.service.js';
import { prisma } from '../../src/lib/prisma.js';
import { AppError } from '../../src/utils/errors.js';

const PROGRAM_A = { id: 'prog-a', name: 'Programa A', logo_url: null };
const PROGRAM_B = { id: 'prog-b', name: 'Programa B', logo_url: null };

function makeParityRow(overrides: Partial<{ id: string; from_points: number; to_points: number }> = {}) {
  return {
    id: overrides.id ?? 'parity-1',
    from_points: overrides.from_points ?? 1,
    to_points: overrides.to_points ?? 1,
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
    fromProgram: PROGRAM_A,
    toProgram: PROGRAM_B,
  };
}

beforeEach(() => {
  vi.mocked(prisma.transferParity.findUnique).mockReset();
  vi.mocked(prisma.transferParity.findMany).mockReset();
  vi.mocked(prisma.transferParity.create).mockReset();
  vi.mocked(prisma.transferParity.update).mockReset();
  vi.mocked(prisma.transferParity.delete).mockReset();
  vi.mocked(prisma.loyaltyProgram.findUnique).mockReset();
});

describe('Property 39: Um programa não pode ter paridade consigo mesmo', () => {
  it('createTransferParity lança 400 quando fromProgramId === toProgramId', async () => {
    await expect(createTransferParity('prog-a', 'prog-a', 1, 1)).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 400
    );
    expect(prisma.transferParity.create).not.toHaveBeenCalled();
  });

  it('updateTransferParity lança 400 quando fromProgramId === toProgramId', async () => {
    vi.mocked(prisma.transferParity.findUnique).mockResolvedValue(makeParityRow() as any);

    await expect(updateTransferParity('parity-1', 'prog-a', 'prog-a', 1, 1)).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 400
    );
    expect(prisma.transferParity.update).not.toHaveBeenCalled();
  });
});

describe('Property 40: Unicidade do par (from, to) é preservada', () => {
  it('createTransferParity lança 409 quando o par já existe', async () => {
    vi.mocked(prisma.loyaltyProgram.findUnique)
      .mockResolvedValueOnce(PROGRAM_A as any)
      .mockResolvedValueOnce(PROGRAM_B as any);
    vi.mocked(prisma.transferParity.findUnique).mockResolvedValue(makeParityRow() as any);

    await expect(createTransferParity('prog-a', 'prog-b', 1, 1)).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 409
    );
    expect(prisma.transferParity.create).not.toHaveBeenCalled();
  });
});

describe('Property 41: Operações em paridades inexistentes retornam 404', () => {
  it('updateTransferParity lança 404 quando a paridade não existe', async () => {
    vi.mocked(prisma.transferParity.findUnique).mockResolvedValue(null);

    await expect(updateTransferParity('does-not-exist', 'prog-a', 'prog-b', 1, 1)).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 404
    );
  });

  it('deleteTransferParity lança 404 quando a paridade não existe', async () => {
    vi.mocked(prisma.transferParity.findUnique).mockResolvedValue(null);

    await expect(deleteTransferParity('does-not-exist')).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 404
    );
    expect(prisma.transferParity.delete).not.toHaveBeenCalled();
  });

  it('deleteTransferParity remove a paridade quando ela existe', async () => {
    vi.mocked(prisma.transferParity.findUnique).mockResolvedValue(makeParityRow({ id: 'parity-1' }) as any);
    vi.mocked(prisma.transferParity.delete).mockResolvedValue(makeParityRow({ id: 'parity-1' }) as any);

    const result = await deleteTransferParity('parity-1');

    expect(result.message).toMatch(/removida/i);
    expect(prisma.transferParity.delete).toHaveBeenCalledWith({ where: { id: 'parity-1' } });
  });
});

describe('Property 42: Proporção deve ser composta por inteiros positivos', () => {
  it('createTransferParity lança 400 para proporções inválidas (zero, negativo ou não-inteiro)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.double({ min: 0.01, max: 10, noNaN: true }).filter((n) => !Number.isInteger(n))
        ),
        async (invalidPoints) => {
          await expect(createTransferParity('prog-a', 'prog-b', invalidPoints, 1)).rejects.toSatisfy(
            (err: unknown) => err instanceof AppError && err.statusCode === 400
          );
          expect(prisma.transferParity.create).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 43: Programas inexistentes são rejeitados com 400', () => {
  it('createTransferParity lança 400 quando fromProgramId ou toProgramId não existe', async () => {
    vi.mocked(prisma.loyaltyProgram.findUnique).mockResolvedValue(null);

    await expect(createTransferParity('missing-a', 'missing-b', 1, 1)).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 400
    );
    expect(prisma.transferParity.create).not.toHaveBeenCalled();
  });
});

describe('listTransferParities achata as duas relações de programa', () => {
  it('retorna cada paridade com fromProgram/toProgram e a proporção', async () => {
    vi.mocked(prisma.transferParity.findMany).mockResolvedValue([
      makeParityRow({ id: 'parity-1', from_points: 2, to_points: 3 }),
    ] as any);

    const result = await listTransferParities();

    expect(result).toEqual([
      {
        id: 'parity-1',
        fromProgram: PROGRAM_A,
        toProgram: PROGRAM_B,
        from_points: 2,
        to_points: 3,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      },
    ]);
  });
});

describe('createTransferParity — caminho feliz', () => {
  it('cria a paridade quando ambos os programas existem e o par é único', async () => {
    vi.mocked(prisma.loyaltyProgram.findUnique)
      .mockResolvedValueOnce(PROGRAM_A as any)
      .mockResolvedValueOnce(PROGRAM_B as any);
    vi.mocked(prisma.transferParity.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.transferParity.create).mockResolvedValue(makeParityRow() as any);

    const result = await createTransferParity('prog-a', 'prog-b', 1, 1);

    expect(result.fromProgram).toEqual(PROGRAM_A);
    expect(result.toProgram).toEqual(PROGRAM_B);
    expect(prisma.transferParity.create).toHaveBeenCalledWith({
      data: { from_program_id: 'prog-a', to_program_id: 'prog-b', from_points: 1, to_points: 1 },
      include: expect.anything(),
    });
  });
});

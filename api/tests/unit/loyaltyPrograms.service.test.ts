// Feature: mileage-management-system — Programas de Fidelidade (catálogo global, ADMIN)
// Property 33: Unicidade de nome de programa é preservada
// Property 34: Operações em programas inexistentes retornam 404
// Property 35: bankIds inválidos são rejeitados com 400
// Property 36: updateLoyaltyProgram substitui integralmente o conjunto de bancos vinculados

import fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTx = {
  loyaltyProgram: {
    update: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  bankLoyaltyProgram: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
};

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    loyaltyProgram: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    bank: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import {
  listLoyaltyPrograms,
  createLoyaltyProgram,
  updateLoyaltyProgram,
  deleteLoyaltyProgram,
} from '../../src/modules/loyaltyPrograms/loyaltyPrograms.service.js';
import { prisma } from '../../src/lib/prisma.js';
import { AppError } from '../../src/utils/errors.js';

function makeProgramRow(overrides: Partial<{ id: string; name: string }> = {}) {
  return {
    id: overrides.id ?? 'prog-1',
    name: overrides.name ?? 'Livelo',
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
    banks: [] as { bank: { id: string; name: string } }[],
  };
}

beforeEach(() => {
  vi.mocked(prisma.loyaltyProgram.findUnique).mockReset();
  vi.mocked(prisma.loyaltyProgram.findMany).mockReset();
  vi.mocked(prisma.loyaltyProgram.create).mockReset();
  vi.mocked(prisma.loyaltyProgram.delete).mockReset();
  vi.mocked(prisma.bank.findMany).mockReset();
  vi.mocked(prisma.$transaction).mockReset();
  mockTx.loyaltyProgram.update.mockReset();
  mockTx.loyaltyProgram.findUniqueOrThrow.mockReset();
  mockTx.bankLoyaltyProgram.deleteMany.mockReset();
  mockTx.bankLoyaltyProgram.createMany.mockReset();

  vi.mocked(prisma.$transaction).mockImplementation(((cb: any) => cb(mockTx)) as any);
});

describe('Property 33: Unicidade de nome de programa é preservada', () => {
  it('createLoyaltyProgram lança 409 quando já existe um programa com o mesmo nome', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (name) => {
        vi.mocked(prisma.loyaltyProgram.findUnique).mockResolvedValue(makeProgramRow({ name }) as any);

        await expect(createLoyaltyProgram(name, [])).rejects.toSatisfy(
          (err: unknown) => err instanceof AppError && err.statusCode === 409
        );
        expect(prisma.loyaltyProgram.create).not.toHaveBeenCalled();
      }),
      { numRuns: 30 }
    );
  });

  it('updateLoyaltyProgram lança 409 quando o novo nome pertence a OUTRO programa', async () => {
    vi.mocked(prisma.loyaltyProgram.findUnique)
      .mockResolvedValueOnce(makeProgramRow({ id: 'prog-1', name: 'Livelo' }) as any)
      .mockResolvedValueOnce(makeProgramRow({ id: 'prog-2', name: 'Esfera' }) as any);

    await expect(updateLoyaltyProgram('prog-1', 'Esfera', [])).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 409
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('Property 34: Operações em programas inexistentes retornam 404', () => {
  it('updateLoyaltyProgram lança 404 quando o programa não existe', async () => {
    vi.mocked(prisma.loyaltyProgram.findUnique).mockResolvedValue(null);

    await expect(updateLoyaltyProgram('does-not-exist', 'Novo Nome', [])).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 404
    );
  });

  it('deleteLoyaltyProgram lança 404 quando o programa não existe', async () => {
    vi.mocked(prisma.loyaltyProgram.findUnique).mockResolvedValue(null);

    await expect(deleteLoyaltyProgram('does-not-exist')).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 404
    );
    expect(prisma.loyaltyProgram.delete).not.toHaveBeenCalled();
  });
});

describe('Property 35: bankIds inválidos são rejeitados com 400', () => {
  it('createLoyaltyProgram lança 400 quando um bankId não existe', async () => {
    vi.mocked(prisma.loyaltyProgram.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.bank.findMany).mockResolvedValue([{ id: 'real-bank' }] as any);

    await expect(createLoyaltyProgram('Livelo', ['real-bank', 'fake-bank'])).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 400
    );
    expect(prisma.loyaltyProgram.create).not.toHaveBeenCalled();
  });
});

describe('Property 36: updateLoyaltyProgram substitui integralmente o conjunto de bancos vinculados', () => {
  it('remove todos os vínculos antigos antes de criar os novos, dentro de uma transação', async () => {
    vi.mocked(prisma.loyaltyProgram.findUnique).mockResolvedValue(makeProgramRow({ id: 'prog-1' }) as any);
    vi.mocked(prisma.bank.findMany).mockResolvedValue([{ id: 'bank-a' }, { id: 'bank-b' }] as any);
    mockTx.loyaltyProgram.findUniqueOrThrow.mockResolvedValue({
      ...makeProgramRow({ id: 'prog-1' }),
      banks: [
        { bank: { id: 'bank-a', name: 'Banco A' } },
        { bank: { id: 'bank-b', name: 'Banco B' } },
      ],
    } as any);

    const result = await updateLoyaltyProgram('prog-1', 'Livelo', ['bank-a', 'bank-b']);

    expect(mockTx.bankLoyaltyProgram.deleteMany).toHaveBeenCalledWith({
      where: { loyalty_program_id: 'prog-1' },
    });
    expect(mockTx.bankLoyaltyProgram.createMany).toHaveBeenCalledWith({
      data: [
        { bank_id: 'bank-a', loyalty_program_id: 'prog-1' },
        { bank_id: 'bank-b', loyalty_program_id: 'prog-1' },
      ],
    });
    expect(result.banks).toEqual([
      { id: 'bank-a', name: 'Banco A' },
      { id: 'bank-b', name: 'Banco B' },
    ]);
  });

  it('não chama createMany quando bankIds é uma lista vazia (apenas desvincula)', async () => {
    vi.mocked(prisma.loyaltyProgram.findUnique).mockResolvedValue(makeProgramRow({ id: 'prog-1' }) as any);
    mockTx.loyaltyProgram.findUniqueOrThrow.mockResolvedValue(makeProgramRow({ id: 'prog-1' }) as any);

    await updateLoyaltyProgram('prog-1', 'Livelo', []);

    expect(mockTx.bankLoyaltyProgram.deleteMany).toHaveBeenCalled();
    expect(mockTx.bankLoyaltyProgram.createMany).not.toHaveBeenCalled();
  });
});

describe('listLoyaltyPrograms achata a relação de bancos', () => {
  it('retorna cada programa com banks como {id,name}[], sem o wrapper do join', async () => {
    vi.mocked(prisma.loyaltyProgram.findMany).mockResolvedValue([
      {
        ...makeProgramRow({ id: 'prog-1', name: 'Livelo' }),
        banks: [
          { bank: { id: 'bank-1', name: 'Banco do Brasil' } },
          { bank: { id: 'bank-2', name: 'Bradesco' } },
        ],
      },
    ] as any);

    const result = await listLoyaltyPrograms();

    expect(result).toEqual([
      expect.objectContaining({
        id: 'prog-1',
        name: 'Livelo',
        banks: [
          { id: 'bank-1', name: 'Banco do Brasil' },
          { id: 'bank-2', name: 'Bradesco' },
        ],
      }),
    ]);
  });
});

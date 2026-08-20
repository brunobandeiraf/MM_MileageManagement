// Feature: mileage-management-system — Bancos (catálogo global, ADMIN)
// Property 30: Unicidade de nome de banco é preservada
// Property 31: Operações em bancos inexistentes retornam 404
// Property 32: Listagem de bancos nunca expõe a estrutura interna do join

import fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    bank: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { listBanks, createBank, updateBank, deleteBank } from '../../src/modules/banks/banks.service.js';
import { prisma } from '../../src/lib/prisma.js';
import { AppError } from '../../src/utils/errors.js';

function makeBankRow(overrides: Partial<{ id: string; name: string }> = {}) {
  return {
    id: overrides.id ?? 'bank-id-1',
    name: overrides.name ?? 'Banco do Brasil',
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
    loyaltyPrograms: [] as { loyaltyProgram: { id: string; name: string } }[],
  };
}

beforeEach(() => {
  vi.mocked(prisma.bank.findUnique).mockReset();
  vi.mocked(prisma.bank.findMany).mockReset();
  vi.mocked(prisma.bank.create).mockReset();
  vi.mocked(prisma.bank.update).mockReset();
  vi.mocked(prisma.bank.delete).mockReset();
});

describe('Property 30: Unicidade de nome de banco é preservada', () => {
  it('createBank lança 409 quando já existe um banco com o mesmo nome', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (name) => {
        vi.mocked(prisma.bank.findUnique).mockResolvedValue(makeBankRow({ name }) as any);

        await expect(createBank(name)).rejects.toSatisfy(
          (err: unknown) => err instanceof AppError && err.statusCode === 409
        );
        expect(prisma.bank.create).not.toHaveBeenCalled();
      }),
      { numRuns: 30 }
    );
  });

  it('updateBank lança 409 quando o novo nome pertence a OUTRO banco', async () => {
    vi.mocked(prisma.bank.findUnique)
      .mockResolvedValueOnce(makeBankRow({ id: 'bank-1', name: 'Bradesco' }) as any) // existing (target)
      .mockResolvedValueOnce(makeBankRow({ id: 'bank-2', name: 'Itaú' }) as any); // conflict

    await expect(updateBank('bank-1', 'Itaú')).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 409
    );
    expect(prisma.bank.update).not.toHaveBeenCalled();
  });

  it('updateBank permite manter o próprio nome (não é conflito consigo mesmo)', async () => {
    vi.mocked(prisma.bank.findUnique).mockResolvedValue(makeBankRow({ id: 'bank-1', name: 'Bradesco' }) as any);
    vi.mocked(prisma.bank.update).mockResolvedValue(makeBankRow({ id: 'bank-1', name: 'Bradesco' }) as any);

    const result = await updateBank('bank-1', 'Bradesco');

    expect(result.name).toBe('Bradesco');
    // findUnique for the conflict check must not run when name is unchanged
    expect(prisma.bank.findUnique).toHaveBeenCalledTimes(1);
  });
});

describe('Property 31: Operações em bancos inexistentes retornam 404', () => {
  it('updateBank lança 404 quando o banco não existe', async () => {
    vi.mocked(prisma.bank.findUnique).mockResolvedValue(null);

    await expect(updateBank('does-not-exist', 'Novo Nome')).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 404
    );
  });

  it('deleteBank lança 404 quando o banco não existe', async () => {
    vi.mocked(prisma.bank.findUnique).mockResolvedValue(null);

    await expect(deleteBank('does-not-exist')).rejects.toSatisfy(
      (err: unknown) => err instanceof AppError && err.statusCode === 404
    );
    expect(prisma.bank.delete).not.toHaveBeenCalled();
  });

  it('deleteBank remove o banco quando ele existe', async () => {
    vi.mocked(prisma.bank.findUnique).mockResolvedValue(makeBankRow({ id: 'bank-1' }) as any);
    vi.mocked(prisma.bank.delete).mockResolvedValue(makeBankRow({ id: 'bank-1' }) as any);

    const result = await deleteBank('bank-1');

    expect(result.message).toMatch(/removido/i);
    expect(prisma.bank.delete).toHaveBeenCalledWith({ where: { id: 'bank-1' } });
  });
});

describe('Property 32: Listagem de bancos achata a relação de programas de fidelidade', () => {
  it('listBanks retorna cada banco com loyaltyPrograms como {id,name}[], sem o wrapper do join', async () => {
    vi.mocked(prisma.bank.findMany).mockResolvedValue([
      {
        ...makeBankRow({ id: 'bank-1', name: 'Banco do Brasil' }),
        loyaltyPrograms: [
          { loyaltyProgram: { id: 'prog-1', name: 'Livelo' } },
          { loyaltyProgram: { id: 'prog-2', name: 'Esfera' } },
        ],
      },
    ] as any);

    const result = await listBanks();

    expect(result).toEqual([
      expect.objectContaining({
        id: 'bank-1',
        name: 'Banco do Brasil',
        loyaltyPrograms: [
          { id: 'prog-1', name: 'Livelo' },
          { id: 'prog-2', name: 'Esfera' },
        ],
      }),
    ]);
  });
});

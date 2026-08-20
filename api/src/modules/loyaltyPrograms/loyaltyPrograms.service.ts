import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';

// ─── DTO ─────────────────────────────────────────────────────────────────────

export type LoyaltyProgramDTO = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: Date;
  updated_at: Date;
  banks: { id: string; name: string }[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ProgramWithBanks = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: Date;
  updated_at: Date;
  banks: { bank: { id: string; name: string } }[];
};

function toDTO(program: ProgramWithBanks): LoyaltyProgramDTO {
  return {
    id: program.id,
    name: program.name,
    logo_url: program.logo_url,
    created_at: program.created_at,
    updated_at: program.updated_at,
    banks: program.banks.map((link) => link.bank),
  };
}

const INCLUDE_BANKS = {
  banks: {
    include: { bank: { select: { id: true, name: true } } },
  },
} as const;

// Data URIs from a resized client-side image land well under this — it's a
// generous safety net against a rogue/oversized payload, not the real cap.
const MAX_LOGO_LENGTH = 2_000_000;

/**
 * Validates that every id in `bankIds` refers to an existing bank. Throws
 * 400 naming the first offender — a stale/typo'd id in the multi-select
 * would otherwise silently link nothing.
 */
async function assertBanksExist(bankIds: string[]): Promise<void> {
  if (bankIds.length === 0) return;

  const found = await prisma.bank.findMany({
    where: { id: { in: bankIds } },
    select: { id: true },
  });
  const foundIds = new Set(found.map((b) => b.id));
  const missing = bankIds.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    throw new AppError(400, `Banco(s) não encontrado(s): ${missing.join(', ')}`);
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Lists every loyalty program in the global catalog, alphabetically, with
 * the banks each one is linked to. Readable by every authenticated role.
 */
export async function listLoyaltyPrograms(): Promise<LoyaltyProgramDTO[]> {
  const programs = await prisma.loyaltyProgram.findMany({
    orderBy: { name: 'asc' },
    include: INCLUDE_BANKS,
  });

  return programs.map(toDTO);
}

/**
 * Creates a new loyalty program, optionally linking it to one or more banks
 * right away (e.g. Livelo linked to Banco do Brasil and Bradesco at once).
 * ADMIN-only — enforced by the router, not here.
 */
export async function createLoyaltyProgram(
  name: string,
  bankIds: string[],
  logoUrl?: string | null
): Promise<LoyaltyProgramDTO> {
  const existing = await prisma.loyaltyProgram.findUnique({ where: { name } });
  if (existing) {
    throw new AppError(409, 'Já existe um programa de fidelidade com esse nome');
  }

  if (logoUrl && logoUrl.length > MAX_LOGO_LENGTH) {
    throw new AppError(400, 'Imagem muito grande');
  }

  await assertBanksExist(bankIds);

  const program = await prisma.loyaltyProgram.create({
    data: {
      name,
      logo_url: logoUrl ?? null,
      banks: { create: bankIds.map((bank_id) => ({ bank_id })) },
    },
    include: INCLUDE_BANKS,
  });

  return toDTO(program);
}

/**
 * Renames a loyalty program, optionally replaces its logo, and/or replaces
 * its full set of linked banks. `bankIds`, when provided, fully replaces the
 * existing links (matching a multi-select form submit) rather than merging
 * with them. `logoUrl` is optional — pass `undefined` to leave the current
 * logo untouched, or `null` to clear it.
 */
export async function updateLoyaltyProgram(
  id: string,
  name: string,
  bankIds: string[],
  logoUrl?: string | null
): Promise<LoyaltyProgramDTO> {
  const existing = await prisma.loyaltyProgram.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Programa de fidelidade não encontrado');
  }

  if (name !== existing.name) {
    const conflict = await prisma.loyaltyProgram.findUnique({ where: { name } });
    if (conflict) {
      throw new AppError(409, 'Já existe um programa de fidelidade com esse nome');
    }
  }

  if (logoUrl && logoUrl.length > MAX_LOGO_LENGTH) {
    throw new AppError(400, 'Imagem muito grande');
  }

  await assertBanksExist(bankIds);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.loyaltyProgram.update({
      where: { id },
      data: { name, ...(logoUrl !== undefined && { logo_url: logoUrl }) },
    });
    await tx.bankLoyaltyProgram.deleteMany({ where: { loyalty_program_id: id } });
    if (bankIds.length > 0) {
      await tx.bankLoyaltyProgram.createMany({
        data: bankIds.map((bank_id) => ({ bank_id, loyalty_program_id: id })),
      });
    }
    return tx.loyaltyProgram.findUniqueOrThrow({ where: { id }, include: INCLUDE_BANKS });
  });

  return toDTO(updated);
}

/**
 * Deletes a loyalty program from the catalog. Cascades to its bank links.
 */
export async function deleteLoyaltyProgram(id: string): Promise<{ message: string }> {
  const existing = await prisma.loyaltyProgram.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Programa de fidelidade não encontrado');
  }

  await prisma.loyaltyProgram.delete({ where: { id } });

  return { message: 'Programa de fidelidade removido com sucesso' };
}

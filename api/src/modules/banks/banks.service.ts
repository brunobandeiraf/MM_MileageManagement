import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';

// ─── DTO ─────────────────────────────────────────────────────────────────────

export type BankDTO = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: Date;
  updated_at: Date;
  loyaltyPrograms: { id: string; name: string }[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

type BankWithPrograms = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: Date;
  updated_at: Date;
  loyaltyPrograms: { loyaltyProgram: { id: string; name: string } }[];
};

function toDTO(bank: BankWithPrograms): BankDTO {
  return {
    id: bank.id,
    name: bank.name,
    logo_url: bank.logo_url,
    created_at: bank.created_at,
    updated_at: bank.updated_at,
    loyaltyPrograms: bank.loyaltyPrograms.map((link) => link.loyaltyProgram),
  };
}

const INCLUDE_PROGRAMS = {
  loyaltyPrograms: {
    include: { loyaltyProgram: { select: { id: true, name: true } } },
  },
} as const;

// Data URIs from a resized client-side image land well under this — it's a
// generous safety net against a rogue/oversized payload, not the real cap.
const MAX_LOGO_LENGTH = 2_000_000;

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Lists every bank in the global catalog, alphabetically, with the loyalty
 * programs each one offers. Readable by every authenticated role — Team and
 * Usuário both need this list to link a bank to themselves or to a user.
 */
export async function listBanks(): Promise<BankDTO[]> {
  const banks = await prisma.bank.findMany({
    orderBy: { name: 'asc' },
    include: INCLUDE_PROGRAMS,
  });

  return banks.map(toDTO);
}

/**
 * Creates a new bank in the global catalog. ADMIN-only — enforced by the
 * router, not here.
 */
export async function createBank(name: string, logoUrl?: string | null): Promise<BankDTO> {
  const existing = await prisma.bank.findUnique({ where: { name } });
  if (existing) {
    throw new AppError(409, 'Já existe um banco com esse nome');
  }

  if (logoUrl && logoUrl.length > MAX_LOGO_LENGTH) {
    throw new AppError(400, 'Imagem muito grande');
  }

  const bank = await prisma.bank.create({
    data: { name, logo_url: logoUrl ?? null },
    include: INCLUDE_PROGRAMS,
  });

  return toDTO(bank);
}

/**
 * Renames an existing bank and/or replaces its logo. Throws 404 if not
 * found, 409 if the new name collides with another bank. `logoUrl` is
 * optional — pass `undefined` to leave the current logo untouched, or
 * `null` to clear it.
 */
export async function updateBank(
  id: string,
  name: string,
  logoUrl?: string | null
): Promise<BankDTO> {
  const existing = await prisma.bank.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Banco não encontrado');
  }

  if (name !== existing.name) {
    const conflict = await prisma.bank.findUnique({ where: { name } });
    if (conflict) {
      throw new AppError(409, 'Já existe um banco com esse nome');
    }
  }

  if (logoUrl && logoUrl.length > MAX_LOGO_LENGTH) {
    throw new AppError(400, 'Imagem muito grande');
  }

  const updated = await prisma.bank.update({
    where: { id },
    data: { name, ...(logoUrl !== undefined && { logo_url: logoUrl }) },
    include: INCLUDE_PROGRAMS,
  });

  return toDTO(updated);
}

/**
 * Deletes a bank from the catalog. Cascades to its loyalty-program links and
 * to every user's assignment of this bank (UserBank rows), same as removing
 * it from the system entirely.
 */
export async function deleteBank(id: string): Promise<{ message: string }> {
  const existing = await prisma.bank.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Banco não encontrado');
  }

  await prisma.bank.delete({ where: { id } });

  return { message: 'Banco removido com sucesso' };
}

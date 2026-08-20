import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';

// ─── DTO ─────────────────────────────────────────────────────────────────────

type ProgramRef = { id: string; name: string; logo_url: string | null };

export type TransferParityDTO = {
  id: string;
  fromProgram: ProgramRef;
  toProgram: ProgramRef;
  from_points: number;
  to_points: number;
  created_at: Date;
  updated_at: Date;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ParityWithPrograms = {
  id: string;
  from_points: number;
  to_points: number;
  created_at: Date;
  updated_at: Date;
  fromProgram: ProgramRef;
  toProgram: ProgramRef;
};

function toDTO(parity: ParityWithPrograms): TransferParityDTO {
  return {
    id: parity.id,
    fromProgram: parity.fromProgram,
    toProgram: parity.toProgram,
    from_points: parity.from_points,
    to_points: parity.to_points,
    created_at: parity.created_at,
    updated_at: parity.updated_at,
  };
}

const PROGRAM_SELECT = { id: true, name: true, logo_url: true } as const;

const INCLUDE_PROGRAMS = {
  fromProgram: { select: PROGRAM_SELECT },
  toProgram: { select: PROGRAM_SELECT },
} as const;

async function assertProgramsExist(fromProgramId: string, toProgramId: string): Promise<void> {
  const [fromProgram, toProgram] = await Promise.all([
    prisma.loyaltyProgram.findUnique({ where: { id: fromProgramId } }),
    prisma.loyaltyProgram.findUnique({ where: { id: toProgramId } }),
  ]);
  if (!fromProgram || !toProgram) {
    throw new AppError(400, 'Programa de fidelidade não encontrado');
  }
}

function assertValidRatio(fromPoints: number, toPoints: number): void {
  if (!Number.isInteger(fromPoints) || !Number.isInteger(toPoints) || fromPoints <= 0 || toPoints <= 0) {
    throw new AppError(400, 'A proporção de pontos deve ser composta por números inteiros positivos');
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Lists every transfer parity in the catalog, alphabetically by the source
 * program's name. Readable by every authenticated role.
 */
export async function listTransferParities(): Promise<TransferParityDTO[]> {
  const parities = await prisma.transferParity.findMany({
    orderBy: { fromProgram: { name: 'asc' } },
    include: INCLUDE_PROGRAMS,
  });

  return parities.map(toDTO);
}

/**
 * Creates a transfer parity from one loyalty program to another (e.g. BTG →
 * Livelo at 1:1). Directional — creating A→B does not imply B→A. ADMIN-only
 * — enforced by the router, not here.
 */
export async function createTransferParity(
  fromProgramId: string,
  toProgramId: string,
  fromPoints: number,
  toPoints: number
): Promise<TransferParityDTO> {
  if (fromProgramId === toProgramId) {
    throw new AppError(400, 'Um programa não pode transferir pontos para si mesmo');
  }

  assertValidRatio(fromPoints, toPoints);
  await assertProgramsExist(fromProgramId, toProgramId);

  const existing = await prisma.transferParity.findUnique({
    where: { from_program_id_to_program_id: { from_program_id: fromProgramId, to_program_id: toProgramId } },
  });
  if (existing) {
    throw new AppError(409, 'Já existe uma paridade de transferência cadastrada entre esses programas');
  }

  const parity = await prisma.transferParity.create({
    data: {
      from_program_id: fromProgramId,
      to_program_id: toProgramId,
      from_points: fromPoints,
      to_points: toPoints,
    },
    include: INCLUDE_PROGRAMS,
  });

  return toDTO(parity);
}

/**
 * Updates the programs and/or ratio of an existing transfer parity. Throws
 * 404 if not found, 409 if the new (from, to) pair collides with another
 * parity.
 */
export async function updateTransferParity(
  id: string,
  fromProgramId: string,
  toProgramId: string,
  fromPoints: number,
  toPoints: number
): Promise<TransferParityDTO> {
  const existing = await prisma.transferParity.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Paridade de transferência não encontrada');
  }

  if (fromProgramId === toProgramId) {
    throw new AppError(400, 'Um programa não pode transferir pontos para si mesmo');
  }

  assertValidRatio(fromPoints, toPoints);
  await assertProgramsExist(fromProgramId, toProgramId);

  if (fromProgramId !== existing.from_program_id || toProgramId !== existing.to_program_id) {
    const conflict = await prisma.transferParity.findUnique({
      where: { from_program_id_to_program_id: { from_program_id: fromProgramId, to_program_id: toProgramId } },
    });
    if (conflict) {
      throw new AppError(409, 'Já existe uma paridade de transferência cadastrada entre esses programas');
    }
  }

  const updated = await prisma.transferParity.update({
    where: { id },
    data: {
      from_program_id: fromProgramId,
      to_program_id: toProgramId,
      from_points: fromPoints,
      to_points: toPoints,
    },
    include: INCLUDE_PROGRAMS,
  });

  return toDTO(updated);
}

/**
 * Deletes a transfer parity from the catalog.
 */
export async function deleteTransferParity(id: string): Promise<{ message: string }> {
  const existing = await prisma.transferParity.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Paridade de transferência não encontrada');
  }

  await prisma.transferParity.delete({ where: { id } });

  return { message: 'Paridade de transferência removida com sucesso' };
}

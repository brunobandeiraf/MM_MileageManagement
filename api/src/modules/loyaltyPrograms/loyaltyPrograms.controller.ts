import { type Request, type Response, type NextFunction } from 'express';
import * as loyaltyProgramsService from './loyaltyPrograms.service.js';
import { AppError } from '../../utils/errors.js';

function parseBankIds(body: unknown): string[] | { error: string } {
  const bankIds = (body as { bankIds?: unknown }).bankIds;
  if (bankIds === undefined) return [];
  if (!Array.isArray(bankIds) || !bankIds.every((id) => typeof id === 'string')) {
    return { error: 'bankIds deve ser uma lista de ids' };
  }
  return bankIds;
}

// ─── GET /loyalty-programs ────────────────────────────────────────

export async function listLoyaltyPrograms(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const programs = await loyaltyProgramsService.listLoyaltyPrograms();
    res.status(200).json({ data: programs });
  } catch (err) {
    next(err);
  }
}

// ─── POST /loyalty-programs ───────────────────────────────────────

export async function createLoyaltyProgram(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, logo_url } = req.body as { name?: string; logo_url?: string | null };

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: ['name'] });
      return;
    }

    const bankIds = parseBankIds(req.body);
    if (!Array.isArray(bankIds)) {
      res.status(400).json({ error: bankIds.error });
      return;
    }

    const program = await loyaltyProgramsService.createLoyaltyProgram(name.trim(), bankIds, logo_url);
    res.status(201).json(program);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── PUT /loyalty-programs/:id ────────────────────────────────────

export async function updateLoyaltyProgram(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { name, logo_url } = req.body as { name?: string; logo_url?: string | null };

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: ['name'] });
      return;
    }

    const bankIds = parseBankIds(req.body);
    if (!Array.isArray(bankIds)) {
      res.status(400).json({ error: bankIds.error });
      return;
    }

    const program = await loyaltyProgramsService.updateLoyaltyProgram(id, name.trim(), bankIds, logo_url);
    res.status(200).json(program);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── DELETE /loyalty-programs/:id ─────────────────────────────────

export async function deleteLoyaltyProgram(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const result = await loyaltyProgramsService.deleteLoyaltyProgram(id);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

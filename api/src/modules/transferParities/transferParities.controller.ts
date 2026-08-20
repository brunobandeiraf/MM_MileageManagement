import { type Request, type Response, type NextFunction } from 'express';
import * as transferParitiesService from './transferParities.service.js';
import { AppError } from '../../utils/errors.js';

function parseBody(body: unknown):
  | { fromProgramId: string; toProgramId: string; fromPoints: number; toPoints: number }
  | { error: string } {
  const b = body as {
    fromProgramId?: unknown;
    toProgramId?: unknown;
    fromPoints?: unknown;
    toPoints?: unknown;
  };

  if (typeof b.fromProgramId !== 'string' || !b.fromProgramId) {
    return { error: 'Campos obrigatórios ausentes: fromProgramId' };
  }
  if (typeof b.toProgramId !== 'string' || !b.toProgramId) {
    return { error: 'Campos obrigatórios ausentes: toProgramId' };
  }

  const fromPoints = b.fromPoints ?? 1;
  const toPoints = b.toPoints ?? 1;
  if (typeof fromPoints !== 'number' || typeof toPoints !== 'number') {
    return { error: 'fromPoints e toPoints devem ser números' };
  }

  return { fromProgramId: b.fromProgramId, toProgramId: b.toProgramId, fromPoints, toPoints };
}

// ─── GET /transfer-parities ───────────────────────────────────────

export async function listTransferParities(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parities = await transferParitiesService.listTransferParities();
    res.status(200).json({ data: parities });
  } catch (err) {
    next(err);
  }
}

// ─── POST /transfer-parities ──────────────────────────────────────

export async function createTransferParity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = parseBody(req.body);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const parity = await transferParitiesService.createTransferParity(
      parsed.fromProgramId,
      parsed.toProgramId,
      parsed.fromPoints,
      parsed.toPoints
    );
    res.status(201).json(parity);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── PUT /transfer-parities/:id ───────────────────────────────────

export async function updateTransferParity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const parsed = parseBody(req.body);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const parity = await transferParitiesService.updateTransferParity(
      id,
      parsed.fromProgramId,
      parsed.toProgramId,
      parsed.fromPoints,
      parsed.toPoints
    );
    res.status(200).json(parity);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── DELETE /transfer-parities/:id ────────────────────────────────

export async function deleteTransferParity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const result = await transferParitiesService.deleteTransferParity(id);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

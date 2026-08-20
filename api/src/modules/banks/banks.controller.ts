import { type Request, type Response, type NextFunction } from 'express';
import * as banksService from './banks.service.js';
import { AppError } from '../../utils/errors.js';

// ─── GET /banks ───────────────────────────────────────────────────

export async function listBanks(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const banks = await banksService.listBanks();
    res.status(200).json({ data: banks });
  } catch (err) {
    next(err);
  }
}

// ─── POST /banks ──────────────────────────────────────────────────

export async function createBank(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, logo_url } = req.body as { name?: string; logo_url?: string | null };

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: ['name'] });
      return;
    }

    const bank = await banksService.createBank(name.trim(), logo_url);
    res.status(201).json(bank);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── PUT /banks/:id ───────────────────────────────────────────────

export async function updateBank(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { name, logo_url } = req.body as { name?: string; logo_url?: string | null };

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: ['name'] });
      return;
    }

    const bank = await banksService.updateBank(id, name.trim(), logo_url);
    res.status(200).json(bank);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── DELETE /banks/:id ────────────────────────────────────────────

export async function deleteBank(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const result = await banksService.deleteBank(id);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

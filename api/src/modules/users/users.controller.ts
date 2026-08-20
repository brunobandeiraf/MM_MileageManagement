import { type Request, type Response, type NextFunction } from 'express';
import * as usersService from './users.service.js';
import { USER_SORT_FIELDS, type UserSortField, type SortOrder } from './users.service.js';
import { AppError } from '../../utils/errors.js';
import { isValidPhone } from '../../utils/phone.js';
import { MIN_PASSWORD_LENGTH } from '../../utils/password.js';

// ─── GET /users ───────────────────────────────────────────────────

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt((req.query['page'] as string) ?? '1', 10) || 1;
    const limit = parseInt((req.query['limit'] as string) ?? '20', 10) || 20;
    const search = (req.query['search'] as string) || undefined;

    const sortByRaw = req.query['sortBy'] as string | undefined;
    if (sortByRaw && !USER_SORT_FIELDS.includes(sortByRaw as UserSortField)) {
      res.status(400).json({ error: `sortBy inválido. Use um de: ${USER_SORT_FIELDS.join(', ')}` });
      return;
    }
    const sortBy = (sortByRaw as UserSortField | undefined) ?? 'created_at';

    const sortOrderRaw = req.query['sortOrder'] as string | undefined;
    if (sortOrderRaw && sortOrderRaw !== 'asc' && sortOrderRaw !== 'desc') {
      res.status(400).json({ error: 'sortOrder inválido. Use "asc" ou "desc"' });
      return;
    }
    const sortOrder = (sortOrderRaw as SortOrder | undefined) ?? 'asc';

    const result = await usersService.listUsers(page, limit, req.user.role, search, sortBy, sortOrder);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── POST /users ──────────────────────────────────────────────────

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, phone, role } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
    };

    const missing: string[] = [];
    if (!name) missing.push('name');
    if (!email) missing.push('email');
    if (!phone) missing.push('phone');

    if (missing.length > 0) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: missing });
      return;
    }

    if (!isValidPhone(phone!)) {
      res.status(400).json({ error: 'Telefone inválido. Use o formato (DD) 9XXXX-XXXX' });
      return;
    }

    if (role !== undefined && role !== 'USER' && role !== 'FUNCIONARIO' && role !== 'ADMIN') {
      res.status(400).json({ error: 'Papel inválido' });
      return;
    }

    const user = await usersService.createUser(
      name!,
      email!,
      phone!,
      role ?? 'USER',
      req.user.role
    );
    res.status(201).json(user);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── PUT /users/:id ───────────────────────────────────────────────

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { name, email, phone } = req.body as { name?: string; email?: string; phone?: string };

    if (phone !== undefined && !isValidPhone(phone)) {
      res.status(400).json({ error: 'Telefone inválido. Use o formato (DD) 9XXXX-XXXX' });
      return;
    }

    const user = await usersService.updateUser(id, { name, email, phone }, req.user.role);
    res.status(200).json(user);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── DELETE /users/:id ────────────────────────────────────────────

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    await usersService.deleteUser(id, req.user.role);
    res.status(200).json({ message: 'Usuário removido com sucesso' });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── PUT /users/:id/password ────────────────────────────────────────

export async function setPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { password } = req.body as { password?: string };

    if (!password) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: ['password'] });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` });
      return;
    }

    const user = await usersService.setUserPassword(id, password, req.user.role);
    res.status(200).json(user);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

// ─── PUT /users/:id/banks ─────────────────────────────────────────

export async function setUserBanks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { bankIds } = req.body as { bankIds?: unknown };

    if (!Array.isArray(bankIds) || !bankIds.every((bankId) => typeof bankId === 'string')) {
      res.status(400).json({ error: 'bankIds deve ser uma lista de ids' });
      return;
    }

    const user = await usersService.setUserBanks(id, bankIds, req.user.role);
    res.status(200).json(user);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

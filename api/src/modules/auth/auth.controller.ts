import { Request, Response, NextFunction } from 'express';
import { signToken } from '../../utils/token.js';
import * as authService from './auth.service.js';
import { env } from '../../config/env.js';
import { MIN_PASSWORD_LENGTH } from '../../utils/password.js';
import { isValidPhone } from '../../utils/phone.js';
import { AppError } from '../../utils/errors.js';

const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours in ms

/**
 * POST /auth/login
 *
 * Validates credentials and sets an httpOnly JWT cookie on success.
 * Returns 400 if required fields are missing, 401 if credentials are invalid.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  // Validate required fields
  const missingFields: string[] = [];
  if (!email) missingFields.push('email');
  if (!password) missingFields.push('password');

  if (missingFields.length > 0) {
    res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: missingFields });
    return;
  }

  // Both fields are guaranteed to be present at this point
  const user = await authService.login(email as string, password as string);

  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const token = signToken({ id: user.id, name: user.name, role: user.role });

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  res.status(200).json({ user });
}

/**
 * POST /auth/logout
 *
 * Clears the JWT cookie and returns a success message.
 */
export function logout(_req: Request, res: Response): void {
  res.clearCookie('token', { path: '/' });
  res.status(200).json({ message: 'Logout realizado com sucesso' });
}

/**
 * POST /auth/set-password
 *
 * Consumes a "set your password" invite/reset token (sent by email on account
 * creation or admin-triggered reset) and sets the account's password. Public —
 * the token itself is the credential.
 */
export async function setPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as { token?: string; password?: string };

  const missingFields: string[] = [];
  if (!token) missingFields.push('token');
  if (!password) missingFields.push('password');

  if (missingFields.length > 0) {
    res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: missingFields });
    return;
  }

  if (password!.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` });
    return;
  }

  const success = await authService.setPassword(token!, password!);

  if (!success) {
    res.status(400).json({ error: 'Link inválido ou expirado' });
    return;
  }

  res.status(200).json({ message: 'Senha definida com sucesso' });
}

/**
 * POST /auth/forgot-password
 *
 * Self-service password recovery. Always responds with the same generic
 * message regardless of whether the email matches an account — this
 * endpoint must never be usable to enumerate registered emails.
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string };

  if (!email) {
    res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: ['email'] });
    return;
  }

  await authService.forgotPassword(email);

  res.status(200).json({
    message: 'Se este email estiver cadastrado, você receberá um link para redefinir sua senha.',
  });
}

/**
 * GET /auth/me
 *
 * Returns the authenticated user's profile data.
 * Requires auth middleware to have set req.user.
 */
export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.me(req.user.id);

  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  res.status(200).json({ user });
}

/**
 * PUT /auth/me
 *
 * Self-service update of the authenticated user's own name, email, phone
 * and/or avatar. Available to every role.
 */
export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, avatar_url } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      avatar_url?: string | null;
    };

    if (phone !== undefined && !isValidPhone(phone)) {
      res.status(400).json({ error: 'Telefone inválido. Use o formato (DD) 9XXXX-XXXX' });
      return;
    }

    const user = await authService.updateMe(req.user.id, { name, email, phone, avatar_url });
    res.status(200).json({ user });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

/**
 * PUT /auth/me/password
 *
 * Self-service password change for the authenticated user. Requires the
 * current password for confirmation.
 */
export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    const missingFields: string[] = [];
    if (!currentPassword) missingFields.push('currentPassword');
    if (!newPassword) missingFields.push('newPassword');

    if (missingFields.length > 0) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: missingFields });
      return;
    }

    if (newPassword!.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` });
      return;
    }

    await authService.changeMyPassword(req.user.id, currentPassword!, newPassword!);
    res.status(200).json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

/**
 * PUT /auth/me/banks
 *
 * Self-service bank assignment — links the authenticated user's own account
 * to one or more banks from the global catalog. Available to every role.
 */
export async function updateMyBanks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bankIds } = req.body as { bankIds?: unknown };

    if (!Array.isArray(bankIds) || !bankIds.every((id) => typeof id === 'string')) {
      res.status(400).json({ error: 'bankIds deve ser uma lista de ids' });
      return;
    }

    const user = await authService.updateMyBanks(req.user.id, bankIds);
    res.status(200).json({ user });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

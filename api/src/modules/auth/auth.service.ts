import { prisma } from '../../lib/prisma.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { hashResetToken } from '../../utils/resetToken.js';
import { issueSetPasswordEmail } from '../../utils/passwordInvite.js';
import { AppError } from '../../utils/errors.js';

// Re-export so callers can import signToken from the service layer if needed,
// but auth.service itself never invokes it.
export { signToken } from '../../utils/token.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  role: 'ADMIN' | 'FUNCIONARIO' | 'USER';
}

const AUTH_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar_url: true,
  role: true,
} as const;

/**
 * Validates email/password credentials.
 *
 * Returns the user's public data on success, or `null` on failure.
 * The same `null` is returned for "email not found" and "wrong password"
 * so callers CANNOT distinguish which field is wrong (security requirement).
 *
 * Never logs credentials or passwords.
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { email } });

  // No account, or account still awaiting its first password (invite not yet accepted)
  if (!user || !user.password_hash) {
    return null;
  }

  const passwordMatch = await comparePassword(password, user.password_hash);

  if (!passwordMatch) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar_url: user.avatar_url,
    role: user.role,
  };
}

/**
 * Consumes a "set your password" invite/reset token and sets the account's
 * password. Returns `true` on success, `false` if the token is unknown,
 * already used, or expired — callers must not distinguish between those
 * cases in the response (avoids leaking token validity to an attacker).
 */
export async function setPassword(token: string, newPassword: string): Promise<boolean> {
  const tokenHash = hashResetToken(token);
  const user = await prisma.user.findUnique({ where: { password_reset_token_hash: tokenHash } });

  if (!user || !user.password_reset_expires_at || user.password_reset_expires_at < new Date()) {
    return false;
  }

  const password_hash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash,
      password_reset_token_hash: null,
      password_reset_expires_at: null,
    },
  });

  return true;
}

/**
 * Self-service "esqueci minha senha": if the email matches an account, sends
 * a "set your password" link to it (reusing the same invite mechanism as
 * account creation). Always resolves without indicating whether the account
 * exists — callers must return the same generic response either way, so this
 * cannot be used to enumerate registered emails.
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return;
  }

  await issueSetPasswordEmail(
    user.id,
    user.name,
    user.email,
    'Mundo Milhas — redefinição de senha',
    'Recebemos uma solicitação para redefinir a senha da sua conta. Se não foi você, ignore este email — sua senha atual continua válida.'
  );
}

/**
 * Fetches the public profile of an authenticated user by their ID.
 *
 * Returns `{ id, name, email, phone, avatar_url, role }` or `null` if the
 * user does not exist. `password_hash` is never included in the return value.
 */
export async function me(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: AUTH_USER_SELECT,
  });

  return user;
}

// Data URIs from a resized client-side image land well under this — it's a
// generous safety net against a rogue/oversized payload, not the real cap.
const MAX_AVATAR_LENGTH = 2_000_000;

/**
 * Self-service profile update — a user editing their OWN name, email, phone
 * and/or avatar. Available to every role; unlike `users.service.updateUser`,
 * there is no admin/FUNCIONARIO visibility restriction here since a person
 * can always edit themselves.
 */
export async function updateMe(
  userId: string,
  data: { name?: string; email?: string; phone?: string; avatar_url?: string | null }
): Promise<AuthUser> {
  if (data.avatar_url && data.avatar_url.length > MAX_AVATAR_LENGTH) {
    throw new AppError(400, 'Imagem muito grande');
  }

  if (data.email) {
    const conflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (conflict && conflict.id !== userId) {
      throw new AppError(409, 'Email já cadastrado');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: AUTH_USER_SELECT,
  });
}

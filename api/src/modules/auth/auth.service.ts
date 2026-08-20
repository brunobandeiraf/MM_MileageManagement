import { prisma } from '../../lib/prisma.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { hashResetToken } from '../../utils/resetToken.js';
import { issueSetPasswordEmail } from '../../utils/passwordInvite.js';
import { sendEmail } from '../../utils/email.js';
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
  banks: { id: string; name: string }[];
}

const AUTH_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar_url: true,
  role: true,
  banks: {
    include: { bank: { select: { id: true, name: true } } },
  },
} as const;

type UserWithBanks = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  role: 'ADMIN' | 'FUNCIONARIO' | 'USER';
  banks: { bank: { id: string; name: string } }[];
};

function toAuthUser(user: UserWithBanks): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar_url: user.avatar_url,
    role: user.role,
    banks: user.banks.map((link) => link.bank),
  };
}

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

  const withBanks = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: AUTH_USER_SELECT,
  });

  return toAuthUser(withBanks);
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

  return user ? toAuthUser(user) : null;
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

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: AUTH_USER_SELECT,
  });

  return toAuthUser(updated);
}

/**
 * Self-service bank assignment — a user linking one or more banks to their
 * OWN account (e.g. "Banco do Brasil, Bradesco"). `bankIds` fully replaces
 * the existing links, matching a multi-select form submit. Available to
 * every role, including plain USER, since anyone can manage their own list.
 */
export async function updateMyBanks(userId: string, bankIds: string[]): Promise<AuthUser> {
  if (bankIds.length > 0) {
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

  const updated = await prisma.$transaction(async (tx) => {
    await tx.userBank.deleteMany({ where: { user_id: userId } });
    if (bankIds.length > 0) {
      await tx.userBank.createMany({
        data: bankIds.map((bank_id) => ({ user_id: userId, bank_id })),
      });
    }
    return tx.user.findUniqueOrThrow({ where: { id: userId }, select: AUTH_USER_SELECT });
  });

  return toAuthUser(updated);
}

/**
 * Self-service password change — a logged-in user changing their OWN
 * password from the profile screen. Requires the current password so an
 * unattended, unlocked session can't be used to lock the real owner out.
 *
 * Throws 401 if the current password doesn't match. Notifies the account by
 * email afterward, same as the admin-driven `setUserPassword` flow.
 */
export async function changeMyPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.password_hash) {
    throw new AppError(401, 'Senha atual incorreta');
  }

  const matches = await comparePassword(currentPassword, user.password_hash);
  if (!matches) {
    throw new AppError(401, 'Senha atual incorreta');
  }

  const password_hash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password_hash,
      password_reset_token_hash: null,
      password_reset_expires_at: null,
    },
  });

  try {
    await sendEmail({
      to: user.email,
      subject: 'Mundo Milhas — sua senha foi alterada',
      html: `
        <p>Olá, <strong>${user.name}</strong>!</p>
        <p>Sua senha de acesso ao Mundo Milhas foi alterada.</p>
        <p>Se você não reconhece esta ação, entre em contato com o suporte imediatamente.</p>
        <p>Atenciosamente,<br/>Equipe Mundo Milhas</p>
      `,
    });
  } catch (err) {
    console.error('[auth.service] Falha ao enviar email de notificação de senha alterada:', err);
  }
}

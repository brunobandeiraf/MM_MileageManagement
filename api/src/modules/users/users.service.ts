import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../utils/password.js';
import { issueSetPasswordEmail } from '../../utils/passwordInvite.js';
import { sendEmail } from '../../utils/email.js';
import { AppError } from '../../utils/errors.js';

export type Role = 'ADMIN' | 'FUNCIONARIO' | 'USER';
export type CreatableRole = 'ADMIN' | 'FUNCIONARIO' | 'USER';

export const USER_SORT_FIELDS = ['name', 'email', 'phone', 'role', 'created_at'] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

// ─── DTO ─────────────────────────────────────────────────────────────────────

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  created_at: Date;
  banks: { id: string; name: string }[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

type UserWithBanks = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  created_at: Date;
  banks: { bank: { id: string; name: string } }[];
};

function toDTO(user: UserWithBanks): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at,
    banks: user.banks.map((link) => link.bank),
  };
}

const SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  created_at: true,
  banks: {
    include: { bank: { select: { id: true, name: true } } },
  },
} as const;

/**
 * A FUNCIONARIO can manage everyone except the ADMIN — the ADMIN account is
 * entirely invisible to and untouchable by FUNCIONARIO users.
 */
function isHiddenFromRequester(targetRole: Role, requesterRole: Role): boolean {
  return targetRole === 'ADMIN' && requesterRole === 'FUNCIONARIO';
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Lists users with pagination, optional name search, and sorting by any of
 * USER_SORT_FIELDS (defaults to created_at asc). Never exposes password_hash.
 * FUNCIONARIO requesters never see the ADMIN account in the results.
 */
export async function listUsers(
  page: number,
  limit: number,
  requesterRole: Role,
  search?: string,
  sortBy: UserSortField = 'created_at',
  sortOrder: SortOrder = 'asc'
): Promise<{ data: UserDTO[]; pagination: { page: number; limit: number; total: number } }> {
  const skip = (page - 1) * limit;

  const where = {
    ...(requesterRole === 'FUNCIONARIO' ? { role: { not: 'ADMIN' as const } } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: SELECT_FIELDS,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map(toDTO),
    pagination: { page, limit, total },
  };
}

/**
 * Creates a new user with no password set, and emails an invite link so the
 * user can choose their own password. Returns a DTO without password_hash.
 *
 * Only ADMIN requesters may create an ADMIN or FUNCIONARIO account; a
 * FUNCIONARIO requester can only create plain USER accounts.
 */
export async function createUser(
  name: string,
  email: string,
  phone: string,
  role: CreatableRole,
  requesterRole: Role
): Promise<UserDTO> {
  // 1. Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email já cadastrado');
  }

  // 2. Only ADMIN can create an ADMIN or FUNCIONARIO account
  if (role !== 'USER' && requesterRole !== 'ADMIN') {
    throw new AppError(403, 'Apenas o administrador pode criar contas de administrador ou de time');
  }

  // 3. Persist user — no password yet; user_type tags it as a management (staff) account
  const user = await prisma.user.create({
    data: { name, email, phone, role, user_type: 'GESTAO' },
    select: SELECT_FIELDS,
  });

  // 4. Issue a "set your password" invite (non-blocking failure — log but don't throw)
  await issueSetPasswordEmail(
    user.id,
    name,
    email,
    'Bem-vindo(a) à Mundo Milhas — defina sua senha',
    `Você foi convidado a fazer parte do sistema de gestão de milhas do Mundo Milhas. Sua conta foi criada com sucesso — falta só você definir sua senha para começar a usar a plataforma.`
  );

  return toDTO(user);
}

/**
 * Updates an existing user's name, email and/or phone.
 * Throws 404 if not found — including when a FUNCIONARIO targets the ADMIN,
 * which is treated as "not found" so its existence is never revealed.
 * Throws 409 if the new email conflicts with another user.
 */
export async function updateUser(
  id: string,
  data: { name?: string; email?: string; phone?: string },
  requesterRole: Role
): Promise<UserDTO> {
  // 1. Check existence (and visibility)
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || isHiddenFromRequester(existing.role, requesterRole)) {
    throw new AppError(404, 'Usuário não encontrado');
  }

  // 2. If email is changing, check uniqueness against other users
  if (data.email && data.email !== existing.email) {
    const conflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (conflict) {
      throw new AppError(409, 'Email já cadastrado');
    }
  }

  // 3. Update and return DTO
  const updated = await prisma.user.update({
    where: { id },
    data,
    select: SELECT_FIELDS,
  });

  return toDTO(updated);
}

/**
 * Deletes a user by ID.
 * Throws 404 if not found — including when a FUNCIONARIO targets the ADMIN.
 * Throws 400 if they are the only ADMIN in the system.
 */
export async function deleteUser(
  id: string,
  requesterRole: Role
): Promise<{ message: string }> {
  // 1. Check existence (and visibility)
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || isHiddenFromRequester(existing.role, requesterRole)) {
    throw new AppError(404, 'Usuário não encontrado');
  }

  // 2. Guard: at least one ADMIN must remain
  if (existing.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw new AppError(400, 'Não é possível excluir o único administrador do sistema');
    }
  }

  // 3. Delete
  await prisma.user.delete({ where: { id } });

  return { message: 'Usuário removido com sucesso' };
}

/**
 * Directly sets a new password for a USER or FUNCIONARIO account — used by an
 * ADMIN or FUNCIONARIO from the Edit dialog (e.g. the person lost access to
 * their email, or an admin wants to hand over a working password in person).
 *
 * Never available for ADMIN targets — even the ADMIN themselves must use the
 * self-service "esqueci minha senha" flow to change their own password, so no
 * single session can silently overwrite another admin's credentials. Hidden
 * (404) from FUNCIONARIO requesters the same way update/delete are.
 *
 * Invalidates any pending "set your password" invite/reset token for the
 * account, and notifies the user by email that their password changed.
 */
export async function setUserPassword(
  id: string,
  password: string,
  requesterRole: Role
): Promise<UserDTO> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || isHiddenFromRequester(existing.role, requesterRole)) {
    throw new AppError(404, 'Usuário não encontrado');
  }

  if (existing.role === 'ADMIN') {
    throw new AppError(400, 'Não é possível definir a senha de um administrador por aqui');
  }

  const password_hash = await hashPassword(password);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      password_hash,
      password_reset_token_hash: null,
      password_reset_expires_at: null,
    },
    select: SELECT_FIELDS,
  });

  try {
    await sendEmail({
      to: existing.email,
      subject: 'Mundo Milhas — sua senha foi alterada',
      html: `
        <p>Olá, <strong>${existing.name}</strong>!</p>
        <p>Sua senha de acesso ao Mundo Milhas foi alterada por um administrador do sistema.</p>
        <p>Se você não reconhece esta ação, entre em contato com o suporte imediatamente.</p>
        <p>Atenciosamente,<br/>Equipe Mundo Milhas</p>
      `,
    });
  } catch (err) {
    console.error('[users.service] Falha ao enviar email de notificação de senha alterada:', err);
  }

  return toDTO(updated);
}

/**
 * Replaces the full set of banks linked to a user — an ADMIN or FUNCIONARIO
 * assigning banks to a user they manage. Same visibility rule as the rest of
 * this module: hidden (404) if a FUNCIONARIO targets the ADMIN.
 *
 * `bankIds` fully replaces the existing links (matching a multi-select form
 * submit) rather than merging with them.
 */
export async function setUserBanks(
  id: string,
  bankIds: string[],
  requesterRole: Role
): Promise<UserDTO> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || isHiddenFromRequester(existing.role, requesterRole)) {
    throw new AppError(404, 'Usuário não encontrado');
  }

  if (bankIds.length > 0) {
    const found = await prisma.bank.findMany({
      where: { id: { in: bankIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((b) => b.id));
    const missing = bankIds.filter((bankId) => !foundIds.has(bankId));
    if (missing.length > 0) {
      throw new AppError(400, `Banco(s) não encontrado(s): ${missing.join(', ')}`);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.userBank.deleteMany({ where: { user_id: id } });
    if (bankIds.length > 0) {
      await tx.userBank.createMany({
        data: bankIds.map((bank_id) => ({ user_id: id, bank_id })),
      });
    }
    return tx.user.findUniqueOrThrow({ where: { id }, select: SELECT_FIELDS });
  });

  return toDTO(updated);
}

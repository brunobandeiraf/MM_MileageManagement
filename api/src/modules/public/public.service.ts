import { prisma } from '../../lib/prisma.js';

export type PublicContact = {
  email: string;
  phone: string;
};

/**
 * Public contact info shown on the marketing landing page — the admin
 * account's email and registered phone. Never exposes anything else about
 * the account (no id, name, role).
 */
export async function getContact(): Promise<PublicContact | null> {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { created_at: 'asc' },
    select: { email: true, phone: true },
  });

  return admin;
}

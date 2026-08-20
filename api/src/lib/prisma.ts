import { PrismaClient } from '@prisma/client';

// Singleton do PrismaClient com lazy initialization
// Garante uma única instância por processo (evita connection pool overflow em dev com hot-reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

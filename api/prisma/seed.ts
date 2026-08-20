import { hashPassword } from '../src/utils/password.js';
import { prisma } from '../src/lib/prisma.js';

/**
 * Pure helper: validates that ADMIN_EMAIL and ADMIN_PASSWORD are present
 * and non-empty. Returns `{ valid: true }` when both are supplied, or
 * `{ valid: false, missing: <varName> }` identifying the first absent variable.
 *
 * Exported for unit-testing without spawning a subprocess.
 */
export function validateSeedEnv(
  email: string | undefined,
  password: string | undefined
): { valid: true } | { valid: false; missing: string } {
  if (!email || email.trim() === '') return { valid: false, missing: 'ADMIN_EMAIL' };
  if (!password || password.trim() === '') return { valid: false, missing: 'ADMIN_PASSWORD' };
  return { valid: true };
}

async function main(): Promise<void> {
  const adminEmail = process.env['ADMIN_EMAIL'];
  const adminPassword = process.env['ADMIN_PASSWORD'];

  // Validate ADMIN_EMAIL
  if (!adminEmail || adminEmail.trim() === '') {
    console.error('[FATAL] Variável de ambiente ausente: ADMIN_EMAIL');
    process.exit(1);
  }

  // Validate ADMIN_PASSWORD
  if (!adminPassword || adminPassword.trim() === '') {
    console.error('[FATAL] Variável de ambiente ausente: ADMIN_PASSWORD');
    process.exit(1);
  }

  // Check if admin user already exists (idempotency)
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log('[seed] Administrador já existe. Nenhuma ação necessária.');
    return;
  }

  // Hash the password — never log the plain-text value
  const passwordHash = await hashPassword(adminPassword);

  // Create the admin user
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email: adminEmail,
      password_hash: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('[seed] Administrador criado com sucesso.');
}

// Only execute when run directly (not when imported by tests).
// `VITEST` env var is set by vitest during test runs.
if (!process.env['VITEST']) {
  main()
    .catch((error: unknown) => {
      console.error('[seed] Erro ao executar seed:', (error as Error).message);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
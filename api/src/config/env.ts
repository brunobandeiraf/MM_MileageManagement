const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
] as const;

/**
 * Pure helper: checks that every name in `required` has a truthy value in `vars`.
 * Returns null when all are present, or the name of the first missing variable.
 */
export function validateEnvVars(
  vars: Record<string, string | undefined>,
  required: readonly string[]
): string | null {
  for (const name of required) {
    if (!vars[name]) return name;
  }
  return null;
}

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    console.error(`[FATAL] Variável de ambiente obrigatória ausente: ${varName}`);
    process.exit(1);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  resendApiKey: process.env.RESEND_API_KEY!,
  resendFromEmail: process.env.RESEND_FROM_EMAIL!,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};

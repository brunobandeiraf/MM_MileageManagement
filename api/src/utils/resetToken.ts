import { randomBytes, createHash } from 'crypto';

export const RESET_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 horas

/**
 * Generates a random, high-entropy token for the "set your password" email
 * link. Only its SHA-256 hash is ever persisted — the raw token exists solely
 * in the email sent to the user, so a database leak can't be used to take
 * over accounts.
 */
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  id: string;
  name: string;
  role: 'ADMIN' | 'FUNCIONARIO' | 'USER';
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '8h' });
}

export function verifyToken(token: string): TokenPayload & { iat: number; exp: number } {
  const decoded = jwt.verify(token, env.jwtSecret);
  return decoded as TokenPayload & { iat: number; exp: number };
}

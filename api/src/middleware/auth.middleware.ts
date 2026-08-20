import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/token.js';

declare global {
  namespace Express {
    interface Request {
      user: TokenPayload & { iat: number; exp: number };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

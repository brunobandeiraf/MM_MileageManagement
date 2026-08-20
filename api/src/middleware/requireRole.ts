import { Request, Response, NextFunction } from 'express';

export function requireRole(
  ...roles: Array<'ADMIN' | 'FUNCIONARIO' | 'USER'>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso não autorizado' });
      return;
    }
    next();
  };
}

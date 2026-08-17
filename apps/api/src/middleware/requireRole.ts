import type { Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from './requireAuth.js';

export function requireRole(role: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: 'forbidden' });
    }
    return next();
  };
}

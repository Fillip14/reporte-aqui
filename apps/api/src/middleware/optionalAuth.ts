import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './requireAuth.js';
import { verifyAccessToken } from '../lib/tokens.js';

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // Invalid/expired token on a public route: proceed unauthenticated
    // instead of rejecting, since the route doesn't require auth.
  }
  return next();
}

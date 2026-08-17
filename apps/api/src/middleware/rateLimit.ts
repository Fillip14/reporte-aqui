import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const AUTH_RATE_LIMIT_MAX = env.AUTH_RATE_LIMIT_MAX;

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

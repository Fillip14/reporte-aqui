import type { Request, Response } from 'express';
import { registerIndividualSchema, registerCompanySchema, loginSchema } from './auth.validation.js';
import * as authService from './auth.service.js';
import {
  EmailAlreadyRegisteredError,
  CnpjAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from './auth.service.js';
import { env } from '../../config/env.js';

export const REFRESH_COOKIE = 'refreshToken';

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export async function registerIndividual(req: Request, res: Response) {
  const parsed = registerIndividualSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }

  try {
    const result = await authService.registerIndividual(parsed.data);
    setRefreshCookie(res, result.refreshToken);
    return res.status(201).json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    if (err instanceof EmailAlreadyRegisteredError) {
      return res.status(409).json({ error: 'email_already_registered' });
    }
    throw err;
  }
}

export async function registerCompany(req: Request, res: Response) {
  const parsed = registerCompanySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }

  try {
    const result = await authService.registerCompany(parsed.data);
    setRefreshCookie(res, result.refreshToken);
    return res.status(201).json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    if (err instanceof EmailAlreadyRegisteredError) {
      return res.status(409).json({ error: 'email_already_registered' });
    }
    if (err instanceof CnpjAlreadyRegisteredError) {
      return res.status(409).json({ error: 'cnpj_already_registered' });
    }
    throw err;
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }

  try {
    const result = await authService.login(parsed.data);
    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    throw err;
  }
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    return res.status(401).json({ error: 'missing_refresh_token' });
  }

  try {
    const result = await authService.refreshSession(token);
    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    if (err instanceof InvalidRefreshTokenError) {
      return res.status(401).json({ error: 'invalid_refresh_token' });
    }
    throw err;
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await authService.logout(token);
  }
  res.clearCookie(REFRESH_COOKIE);
  return res.status(204).send();
}

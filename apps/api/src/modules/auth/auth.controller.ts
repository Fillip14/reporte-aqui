import type { Request, Response } from 'express';
import { registerIndividualSchema, registerCompanySchema } from './auth.validation.js';
import * as authService from './auth.service.js';
import { EmailAlreadyRegisteredError, CnpjAlreadyRegisteredError } from './auth.service.js';

export const REFRESH_COOKIE = 'refreshToken';

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
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

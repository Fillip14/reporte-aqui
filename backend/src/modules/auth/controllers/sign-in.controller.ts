import { HttpStatus } from '../../../constants/api.constants';
import { signService } from '../services/sign-in.service';
import express, { Request, Response } from 'express';
import logger from '../../../utils/log/logger';
import { asyncHandler } from '../../../utils/asyncHandler';

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const userData = res.locals.validated;

  const authToken = await signService(userData);

  res.cookie('auth', authToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 5 * 60 * 1000,
  });

  logger.info('Login realizado com sucesso.');
  res.status(HttpStatus.OK).json({ message: 'Login realizado com sucesso.' });
});

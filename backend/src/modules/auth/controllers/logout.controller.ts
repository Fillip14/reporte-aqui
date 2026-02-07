import express, { Request, Response } from 'express';
import { HttpStatus } from '../../../constants/api.constants';
import logger from '../../../utils/log/logger';
import { clearCookieAuth } from '../services/logout.service';
import { AppError } from '../../../errors/AppError';

export const logoutController = (req: Request, res: Response) => {
  if (clearCookieAuth(req, res)) {
    logger.info('Sessão encerrada com sucesso.');
    res.status(HttpStatus.OK).json({ message: 'Sessão encerrada com sucesso.' });
  }
  throw new AppError('Sessão não encontrada.', HttpStatus.BAD_REQUEST);
};

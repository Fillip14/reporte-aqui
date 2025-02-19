import express, { Request, Response } from 'express';
import { HttpStatus } from '../../../constants/api.constants';
import logger from '../../../utils/log/logger';
import { clearCookieAuth } from '../services/logout.service';

export const logoutController = (req: Request, res: Response) => {
  if (clearCookieAuth(req, res)) {
    logger.info('Sessão encerrada com sucesso.');
    res.status(HttpStatus.OK).json({ message: 'Sessão encerrada com sucesso.' });
  }
  logger.error('Sessão não encontrada.');
  res.status(HttpStatus.BAD_REQUEST).json({ error: 'Sessão não encontrada.' });
};

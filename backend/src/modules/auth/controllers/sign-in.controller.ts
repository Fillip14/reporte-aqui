import { HttpStatus } from '../../../constants/api.constants';
import { signInSchema } from '../schemas/sign-in.schema';
import { signInService } from '../services/sign-in.service';
import express, { Request, Response } from 'express';
import logger from '../../../utils/log/logger';

export const loginController = async (req: Request, res: Response) => {
  try {
    const userData = signInSchema.safeParse(req.body);

    if (!userData.success) {
      logger.error(`Email ou senha incorreto ou faltando. ${userData.error}`);
      res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email ou senha inválidos.' });
      return;
    }

    const authToken = await signInService.login(userData.data);

    res.cookie('auth', authToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 5 * 60 * 1000,
    });

    logger.info('Login realizado com sucesso.');
    res.status(HttpStatus.OK).json({ message: 'Login realizado com sucesso.' });
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Email ou senha inválidos.' });
  }
};

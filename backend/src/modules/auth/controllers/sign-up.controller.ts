import { HttpStatus } from '../../../constants/api.constants';
import { signUpSchema } from '../schemas/sign-up.schema';
import { signUpService } from '../services/sing-up.service';
import express, { Request, Response } from 'express';
import logger from '../../../utils/logger';

export const registerController = async (req: Request, res: Response) => {
  try {
    const userData = signUpSchema.safeParse(req.body);

    if (!userData.success) {
      logger.error(`Algum item do cadastro esta incorreto ou faltando. ${userData.error}`);
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Informações incorretas ou faltando.' });
      return;
    }

    const userRegistered = await signUpService.register(userData.data);

    logger.info(`Cadastro realizado com sucesso. Usuário: ${userRegistered}`);
    res.status(HttpStatus.CREATED).json({ message: 'Cadastro realizado com sucesso.' });
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

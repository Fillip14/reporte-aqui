import { HttpStatus } from '../../../constants/api.constants';
import { signUpSchema } from '../schemas/sign-up.schema';
import { signUpService } from '../services/sing-up.service';
import express, { Request, Response } from 'express';
import logger from '../../../utils/log/logger';

export const registerController = async (req: Request, res: Response) => {
  try {
    const { document, ...userData } = req.body;

    if (!document) res.status(HttpStatus.BAD_REQUEST).json({ error: 'Documento não informado.' });

    await signUpService.findUser(document);

    if (Object.keys(userData).length === 0) {
      res.status(HttpStatus.OK).json({});
      return;
    }

    const dataToSignUp = signUpSchema.safeParse({ document, ...userData });

    if (!dataToSignUp.success) {
      logger.error(`Algum item do cadastro esta incorreto ou faltando. ${dataToSignUp.error}`);
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Informações incorretas ou faltando.' });
      return;
    }

    const userRegistered = await signUpService.register(dataToSignUp.data);

    logger.info(`Cadastro realizado com sucesso. Usuário: ${userRegistered}`);
    res.status(HttpStatus.CREATED).json({ message: 'Cadastro realizado com sucesso.' });
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

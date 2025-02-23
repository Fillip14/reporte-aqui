import { Request, Response } from 'express';
import { profileDataSchema, profileUpdateSchema } from '../schemas/profile.schema';
import { HttpStatus } from '../../../constants/api.constants';
import {
  deleteProfileService,
  getProfileService,
  patchProfileService,
} from '../service/profile.service';
import logger from '../../../utils/log/logger';

export const getProfileController = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const userData = profileDataSchema.safeParse(user);

    if (!userData.success) {
      logger.error(`ID ou Type do usuario faltando. ${userData.error}`);
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Informações incorretas ou faltando.' });
      return;
    }
    const data = await getProfileService(userData.data);

    logger.info(`Busca realizada com sucesso. ID: ${userData.data.id}`);
    res.status(HttpStatus.OK).json({ message: data });
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
  return;
};

export const patchProfileController = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const userData = profileUpdateSchema.safeParse(req.body);

    if (!userData.success) {
      logger.error(`Dados cadastrais incorretos ou faltando. ${userData.error}`);
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Informações incorretas ou faltando.' });
      return;
    }
    await patchProfileService(userData.data, user.id);

    logger.info(`Atualizacao realizada com sucesso. ID: ${user.id}`);
    res.status(HttpStatus.OK).json({});
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
  return;
};

export const deleteProfileController = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const userData = profileDataSchema.safeParse(user);

    if (!userData.success) {
      logger.error(`Dados cadastrais incorretos ou faltando. ${userData.error}`);
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Informações incorretas ou faltando.' });
      return;
    }
    await deleteProfileService(userData.data);

    logger.info(`Usuário excluido com sucesso. ID: ${user.id}`);
    res.status(HttpStatus.OK).json({});
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
  return;
};

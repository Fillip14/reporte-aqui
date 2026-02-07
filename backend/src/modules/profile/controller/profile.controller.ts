import { Request, Response } from 'express';
import { profileDataSchema } from '../schemas/profile.schema';
import { HttpStatus } from '../../../constants/api.constants';
import {
  deleteProfileService,
  getProfileService,
  patchProfileService,
} from '../service/profile.service';
import logger from '../../../utils/log/logger';
import { asyncHandler } from '../../../utils/asyncHandler';

export const getProfileController = asyncHandler(async (req: Request, res: Response) => {
  const userData = res.locals.validated;

  const data = await getProfileService(userData);

  logger.info(`Busca realizada com sucesso. ID: ${userData.user_id}`);
  res.status(HttpStatus.OK).json({ message: data });
  return;
});

export const patchProfileController = asyncHandler(async (req: Request, res: Response) => {
  const user = res.locals.user;
  const userData = res.locals.validated;

  await patchProfileService(userData, user.user_id);

  logger.info(`Atualizacao realizada com sucesso. ID: ${user.user_id}`);
  res.status(HttpStatus.OK).json({});
  return;
});

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

    logger.info(`Usuário excluido com sucesso. ID: ${user.user_id}`);
    res.status(HttpStatus.OK).json({});
  } catch (error: any) {
    logger.error(`${error}`);
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
  return;
};

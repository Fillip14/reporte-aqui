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
import { clearCookieAuth } from '../../auth/services/logout.service';

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
  res.status(HttpStatus.OK).json({ success: true });
  return;
});

export const deleteProfileController = asyncHandler(async (req: Request, res: Response) => {
  const userData = res.locals.validated;

  await deleteProfileService(userData);
  clearCookieAuth(req, res);

  logger.info(`Usuário excluido com sucesso. ID: ${userData.user_id}`);
  res.status(HttpStatus.OK).json({ success: true });
  return;
});

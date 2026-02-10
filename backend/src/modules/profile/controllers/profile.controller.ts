import { Request, Response } from 'express';
import { HttpStatus } from '../../../constants/api.constants';
import {
  deleteProfileService,
  findProfileService,
  patchProfileService,
} from '../services/profile.service';
import logger from '../../../utils/log/logger';
import { asyncHandler } from '../../../utils/asyncHandler';
import { clearCookieAuth } from '../../auth/services/logout.service';
import { findUserService } from '../../users/services/user.service';
import { Column } from '../../../constants/database.constants';

export const getProfileController = asyncHandler(async (req: Request, res: Response) => {
  const user = res.locals.validated;

  const userData = await findUserService(Column.UUID, user.user_id, [Column.EMAIL]);
  const profileData = await findProfileService(Column.USER_ID, user.user_id);

  logger.info(`Busca realizada com sucesso. ID: ${user.user_id}`);
  res.status(HttpStatus.OK).json({ message: { userData, profileData } });
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

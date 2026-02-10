import { Request, Response } from 'express';
import { HttpStatus } from '../../../constants/api.constants';
import { deleteAccountService, patchAccountService } from '../services/account.service';
import logger from '../../../utils/log/logger';
import { asyncHandler } from '../../../utils/asyncHandler';
import { clearCookieAuth } from '../../auth/services/logout.service';
import { findUserService } from '../../users/services/user.service';
import { Column } from '../../../constants/database.constants';
import { findProfileService } from '../../profile/services/profile.service';

export const getAccountController = asyncHandler(async (req: Request, res: Response) => {
  const user = res.locals.validated;

  const userData = await findUserService(Column.UUID, user.user_id, [Column.EMAIL]);
  const profileData = await findProfileService(Column.USER_ID, user.user_id);

  logger.info(`Busca realizada com sucesso. ID: ${user.user_id}`);
  res.status(HttpStatus.OK).json({ message: { userData, profileData } });
  return;
});

export const patchAccountController = asyncHandler(async (req: Request, res: Response) => {
  const user = res.locals.user;
  const userData = res.locals.validated;

  await patchAccountService(userData, user.user_id);

  logger.info(`Atualizacao realizada com sucesso. ID: ${user.user_id}`);
  res.status(HttpStatus.OK).json({ success: true });
  return;
});

export const deleteAccountController = asyncHandler(async (req: Request, res: Response) => {
  const userData = res.locals.validated;

  await deleteAccountService(userData);
  clearCookieAuth(req, res);

  logger.info(`Usuário excluido com sucesso. ID: ${userData.user_id}`);
  res.status(HttpStatus.OK).json({ success: true });
  return;
});

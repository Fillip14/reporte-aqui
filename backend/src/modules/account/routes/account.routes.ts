import { Router } from 'express';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import {
  getAccountController,
  patchAccountController,
  deleteAccountController,
} from '../controllers/account.controller';
import { validate } from '../../../middlewares/validate-schema.middleware';
import { accountUserSchema, accountUpdateSchema } from '../schemas/account.schema';

const routesAccount = Router();
const PROFILE_BASE_PATH = '/account';

routesAccount.get(
  PROFILE_BASE_PATH,
  authMiddleware(),
  validate(accountUserSchema, (_req, res) => res.locals.user),
  getAccountController,
);
routesAccount.patch(
  PROFILE_BASE_PATH,
  authMiddleware(),
  validate(accountUpdateSchema),
  patchAccountController,
);
routesAccount.delete(
  PROFILE_BASE_PATH,
  authMiddleware(),
  validate(accountUserSchema, (_req, res) => res.locals.user),
  deleteAccountController,
);

export default routesAccount;

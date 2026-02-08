import { Router } from 'express';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import {
  getProfileController,
  patchProfileController,
  deleteProfileController,
} from '../controller/profile.controller';
import { validate } from '../../../middlewares/validate-schema.middleware';
import { profileDataSchema, profileUpdateSchema } from '../schemas/profile.schema';

const routesProfile = Router();
const PROFILE_BASE_PATH = '/profile';

routesProfile.get(
  PROFILE_BASE_PATH,
  authMiddleware(),
  validate(profileDataSchema, (_req, res) => res.locals.user),
  getProfileController,
);
routesProfile.patch(
  PROFILE_BASE_PATH,
  authMiddleware(),
  validate(profileUpdateSchema),
  patchProfileController,
);
routesProfile.delete(
  PROFILE_BASE_PATH,
  authMiddleware(),
  validate(profileDataSchema, (_req, res) => res.locals.user),
  deleteProfileController,
);

export default routesProfile;

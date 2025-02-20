import express from 'express';
import { authMiddleware } from '../../../middlewares/middleware';
import { getProfileController, patchProfileController } from '../controller/profile.controller';

const routesProfile = express.Router();

routesProfile.get('/profile', authMiddleware(), getProfileController);
routesProfile.patch('/profile', authMiddleware(), patchProfileController);

export default routesProfile;

import { Router } from 'express';
import * as authController from './auth.controller.js';

const authRouter = Router();

authRouter.post('/register/individual', authController.registerIndividual);
authRouter.post('/register/company', authController.registerCompany);
authRouter.post('/login', authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);

export default authRouter;

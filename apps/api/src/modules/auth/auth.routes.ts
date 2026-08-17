import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authRateLimit } from '../../middleware/rateLimit.js';

const authRouter = Router();

authRouter.post('/register/individual', authRateLimit, authController.registerIndividual);
authRouter.post('/register/company', authRateLimit, authController.registerCompany);
authRouter.post('/login', authRateLimit, authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);

export default authRouter;

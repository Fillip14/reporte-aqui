import { Router } from 'express';
import * as authController from './auth.controller.js';

const authRouter = Router();

authRouter.post('/register/individual', authController.registerIndividual);
authRouter.post('/register/company', authController.registerCompany);

export default authRouter;

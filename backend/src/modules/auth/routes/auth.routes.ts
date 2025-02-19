import express from 'express';
import { registerController } from '../controllers/sign-up.controller';
import { loginController } from '../controllers/sign-in.controller';
import { logoutController } from '../controllers/logout.controller';

const routesAuth = express.Router();

routesAuth.post('/signup', registerController);
routesAuth.post('/signin', loginController);
routesAuth.post('/logout', logoutController);

export default routesAuth;

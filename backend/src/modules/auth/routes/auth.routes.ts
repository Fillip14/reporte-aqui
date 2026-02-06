import { Router } from 'express';
import { registerController } from '../controllers/sign-up.controller';
import { loginController } from '../controllers/sign-in.controller';
import { logoutController } from '../controllers/logout.controller';
import { checkDocumentController } from '../controllers/check-document.controller';

const routesAuth = Router();
const AUTH_BASE_PATH = '/auth';

routesAuth.post(AUTH_BASE_PATH + '/check-document', checkDocumentController);
routesAuth.post(AUTH_BASE_PATH + '/signup', registerController);
routesAuth.post(AUTH_BASE_PATH + '/signin', loginController);
routesAuth.post(AUTH_BASE_PATH + '/logout', logoutController);

export default routesAuth;

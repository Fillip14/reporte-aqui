import { Router } from 'express';
import { registerController } from '../controllers/sign-up.controller';
import { loginController } from '../controllers/sign-in.controller';
import { logoutController } from '../controllers/logout.controller';
import { checkDocController } from '../controllers/check-doc.controller';
import { validate } from '../../../middlewares/validate-schema.middleware';
import { signUpSchema } from '../schemas/sign-up.schema';
import { checkDocSchema } from '../schemas/check-doc.schema';
import { signInSchema } from '../schemas/sign-in.schema';

const routesAuth = Router();
const AUTH_BASE_PATH = '/auth';

routesAuth.post(AUTH_BASE_PATH + '/check-document', validate(checkDocSchema), checkDocController);
routesAuth.post(AUTH_BASE_PATH + '/signup', validate(signUpSchema), registerController);
routesAuth.post(AUTH_BASE_PATH + '/signin', validate(signInSchema), loginController);
routesAuth.post(AUTH_BASE_PATH + '/logout', logoutController);

export default routesAuth;

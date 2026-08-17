import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import * as meController from './me.controller.js';

const meRouter = Router();

meRouter.get('/', requireAuth, meController.getMe);
meRouter.patch('/', requireAuth, meController.updateMe);
meRouter.delete('/', requireAuth, meController.deleteMe);

export default meRouter;

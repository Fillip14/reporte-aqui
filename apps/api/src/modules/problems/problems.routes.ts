import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import * as problemsController from './problems.controller.js';

const problemsRouter = Router();

problemsRouter.post('/', requireAuth, problemsController.createProblem);

export default problemsRouter;

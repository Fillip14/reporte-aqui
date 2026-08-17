import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { optionalAuth } from '../../middleware/optionalAuth.js';
import * as problemsController from './problems.controller.js';

const problemsRouter = Router();

problemsRouter.post('/', requireAuth, problemsController.createProblem);
problemsRouter.get('/', optionalAuth, problemsController.listProblems);
problemsRouter.get('/:id', optionalAuth, problemsController.getProblem);

export default problemsRouter;

import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { optionalAuth } from '../../middleware/optionalAuth.js';
import * as problemsController from './problems.controller.js';

const problemsRouter = Router();

problemsRouter.post('/', requireAuth, problemsController.createProblem);
problemsRouter.get('/', optionalAuth, problemsController.listProblems);
problemsRouter.get('/:id', optionalAuth, problemsController.getProblem);
problemsRouter.post('/:id/cancel', requireAuth, problemsController.cancelProblem);
problemsRouter.post('/:id/resolve', requireAuth, problemsController.resolveProblem);
problemsRouter.post('/:id/vote', requireAuth, problemsController.toggleVote);
problemsRouter.post('/:id/resolution-proposals', requireAuth, problemsController.createResolutionProposal);
problemsRouter.post('/:id/rating', requireAuth, problemsController.rateResolution);

export default problemsRouter;

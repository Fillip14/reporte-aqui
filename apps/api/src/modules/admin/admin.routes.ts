import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as adminController from './admin.controller.js';

const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));
adminRouter.get('/companies/pending', adminController.listPendingCompanies);
adminRouter.post('/companies/:id/approve', adminController.approveCompany);
adminRouter.post('/companies/:id/reject', adminController.rejectCompany);

adminRouter.get('/resolution-proposals/pending', adminController.listPendingResolutionProposals);
adminRouter.post('/resolution-proposals/:id/approve', adminController.approveResolutionProposal);
adminRouter.post('/resolution-proposals/:id/reject', adminController.rejectResolutionProposal);

export default adminRouter;

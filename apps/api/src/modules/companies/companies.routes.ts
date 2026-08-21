import { Router } from 'express';
import * as companiesController from './companies.controller.js';

const companiesRouter = Router();

companiesRouter.get('/', companiesController.listCompanies);

export default companiesRouter;

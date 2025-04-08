import express from 'express';
import { authMiddleware } from '../../../middlewares/middleware';
import { UserType } from '../../../constants/api.constants';
import { registerReport, listReports } from '../controllers/individual-controller';
import { uploadMiddlewareArray } from '../../../middlewares/storage.middleware';

const routesReports = express.Router();

routesReports.post(
  '/report',
  uploadMiddlewareArray,
  authMiddleware(UserType.INDIVIDUAL),
  registerReport
);

routesReports.get('/list-reports', authMiddleware(UserType.INDIVIDUAL), listReports);

export default routesReports;

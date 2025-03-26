import express from 'express';
import { authMiddleware } from '../../../middlewares/middleware';
import { UserType } from '../../../constants/api.constants';
import { registerReport, listReports } from '../controllers/individual-controller';

const routesReports = express.Router();

routesReports.get('/list-reports', authMiddleware(UserType.INDIVIDUAL), listReports);
routesReports.post('/report', authMiddleware(UserType.INDIVIDUAL), registerReport);

export default routesReports;

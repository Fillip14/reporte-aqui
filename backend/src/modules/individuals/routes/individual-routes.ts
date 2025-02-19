import express from 'express';
import { authMiddleware } from '../../../middlewares/middleware';
import { UserType } from '../constants/individual.constants';

const router = express.Router();

router.get('/update-profile', authMiddleware(UserType.INDIVIDUAL));
router.post('/update-profile', authMiddleware(UserType.INDIVIDUAL));

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', (req, res) => {
  res.send('Homepage');
});

router.get('/teste', authMiddleware(), (req, res) => {
  res.send('Usuário autorizado');
});

export default router;

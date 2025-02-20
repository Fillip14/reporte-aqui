import express from 'express';
import { authMiddleware } from '../middlewares/middleware';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Homepage');
});

router.get('/teste', authMiddleware(), (req, res) => {
  res.send('Usuário autorizado');
});

export default router;

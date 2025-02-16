import express from 'express';
import { registerController } from '../modules/auth/controllers/signup-controller';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Homepage');
});

router.get('/ajuda', (req, res) => {
  res.send('Ajuda');
});

router.post('/register', registerController);

export default router;

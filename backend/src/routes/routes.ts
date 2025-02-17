import express from 'express';
import { registerController } from '../modules/auth/controllers/sign-up.controller';
import { loginController } from '../modules/auth/controllers/sign-in.controller';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Homepage');
});

router.get('/ajuda', (req, res) => {
  res.send('Ajuda');
});

router.post('/signup', registerController);
router.post('/signin', loginController);

export default router;

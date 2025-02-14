import express from 'express';
import {
  registerCompany,
  registerUser,
} from '../controllers/registerController';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Homepage');
});

router.get('/ajuda', (req, res) => {
  res.send('Ajuda');
});

router.post('/register/user', registerUser);
router.post('/register/company', registerCompany);

export default router;

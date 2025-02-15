import express from 'express';
import { registerUser } from '../modules/users/controllers/user-controller';
import { registerCompany } from '../modules/companies/controllers/company-controller';

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

import express from 'express';
import { UserService, CompanyService } from '../controllers/registerController';
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Homepage');
});

router.get('/ajuda', (req, res) => {
  res.send('Ajuda');
});

router.post('/register/user', async (req, res) => {
  const {
    email,
    name,
    cpf,
    country,
    state,
    city,
    neighborhood,
    street,
    number,
    zipcode,
    password,
  } = req.body;

  try {
    const user = await UserService.register(
      email,
      name,
      cpf,
      country,
      state,
      city,
      neighborhood,
      street,
      number,
      zipcode,
      password
    );
    res.status(201).json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/register/company', async (req, res) => {
  const {
    companyEmail,
    companyName,
    cnpj,
    country,
    state,
    city,
    neighborhood,
    street,
    number,
    zipcode,
    password,
  } = req.body;

  try {
    const company = await CompanyService.register(
      companyEmail,
      companyName,
      cnpj,
      country,
      state,
      city,
      neighborhood,
      street,
      number,
      zipcode,
      password
    );
    res.status(201).json({ company });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

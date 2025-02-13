import express from 'express';
import { UserService } from '../controllers/registerController';
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Homepage');
});

router.get('/ajuda', (req, res) => {
  res.send('Ajuda');
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await UserService.register(username, password);
    res.status(201).json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

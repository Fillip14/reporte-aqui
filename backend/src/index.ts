import logger from './utils/log/logger';
import { app } from './server';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});

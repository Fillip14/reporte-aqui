import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/routes';
import logger from './utils/logger';
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());
app.use(routes);

app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});

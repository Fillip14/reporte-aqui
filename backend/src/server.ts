import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { limiter } from './config/limiterOptions';
import { corsOptions } from './config/corsOptinos';
import routes from './routes/routes';
import * as middlewares from './middlewares/middleware';
const xssClean = require('xss-clean');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(limiter);
app.use(cors(corsOptions));
app.use(express.json());
app.use(xssClean());
app.use(routes);
app.use(middlewares.errorsMiddleware);
app.use(middlewares.logTimeMiddleware);
app.use(middlewares.notFoundMiddleware);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

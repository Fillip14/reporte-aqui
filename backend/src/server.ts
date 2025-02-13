import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/routes';
import {logTimeMiddleware, errorsMiddleware, notFoundMiddleware} from './middlewares/middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(routes)
app.use(errorsMiddleware)
app.use(logTimeMiddleware)
app.use(notFoundMiddleware)

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
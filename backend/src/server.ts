import express from 'express';
import routes from './routes/routes';
const cookieParser = require('cookie-parser');

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(routes);
// app.use(routerAuth);

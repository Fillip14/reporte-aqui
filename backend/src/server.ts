import express from 'express';
import routes from './routes/routes';
import routesAuth from './modules/auth/routes/route-auth';
const cookieParser = require('cookie-parser');

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(routesAuth);
app.use(routes);

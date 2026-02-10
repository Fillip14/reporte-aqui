import express from 'express';
import routes from './routes/routes';
import routesAuth from './modules/auth/routes/auth.routes';
import routesReports from './modules/individuals/routes/individual.routes';
import storageRoutes from './modules/storage/routes/storage.routes';
import routesCompany from './modules/companies/routes/company-routes';
import { HttpStatus } from './constants/api.constants';
import { errorMiddleware } from './middlewares/error.middleware';
import routesAccount from './modules/account/routes/account.routes';

const cookieParser = require('cookie-parser');
const API_PREFIX = '/api';

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(API_PREFIX, routesAuth);
app.use(API_PREFIX, routesAccount);
app.use(API_PREFIX, routesReports);
app.use(API_PREFIX, storageRoutes);
app.use(API_PREFIX, routesCompany);
app.use(API_PREFIX, routes);

app.use(API_PREFIX, (req, res) => {
  res.status(HttpStatus.NOT_FOUND).json({ message: 'API route not found' });
});

app.use(errorMiddleware);
// app.use(express.static(frontendPath));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(frontendPath, 'index.html'));
// });

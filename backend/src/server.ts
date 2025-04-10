import express from 'express';
import routes from './routes/routes';
import routesAuth from './modules/auth/routes/auth.routes';
import routesProfile from './modules/profile/routes/profile.routes';
import routesReports from './modules/individuals/routes/individual-routes';
import storageRoutes from './modules/storage/routes/storage.routes';
const cookieParser = require('cookie-parser');

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(routesAuth);
app.use(routesProfile);
app.use(routesProfile);
app.use(routesReports);
app.use(storageRoutes);
app.use(routes);

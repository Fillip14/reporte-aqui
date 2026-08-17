import 'express-async-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.routes.js';
import meRouter from './modules/me/me.routes.js';
import adminRouter from './modules/admin/admin.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/auth', authRouter);
  app.use('/me', meRouter);
  app.use('/admin', adminRouter);

  app.use(errorHandler);

  return app;
}

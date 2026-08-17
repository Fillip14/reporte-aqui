import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.routes.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/auth', authRouter);

  return app;
}

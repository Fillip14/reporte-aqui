import 'express-async-errors';
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from './errorHandler.js';

function buildApp() {
  const app = express();

  app.get('/sync-throw', () => {
    throw new Error('boom');
  });

  app.get('/async-throw', async () => {
    throw new Error('boom');
  });

  app.use(errorHandler);

  return app;
}

describe('errorHandler', () => {
  it('responds 500 with internal_error for a synchronous throw', async () => {
    const app = buildApp();
    const res = await request(app).get('/sync-throw');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'internal_error' });
  });

  it('responds 500 with internal_error for a rejected async handler', async () => {
    const app = buildApp();
    const res = await request(app).get('/async-throw');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'internal_error' });
  });
});

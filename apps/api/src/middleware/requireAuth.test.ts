import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireAuth, type AuthenticatedRequest } from './requireAuth.js';
import { signAccessToken } from '../lib/tokens.js';

function buildTestApp() {
  const app = express();
  app.get('/protected', requireAuth, (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    res.status(200).json({ userId: authedReq.user?.id, role: authedReq.user?.role });
  });
  return app;
}

describe('requireAuth', () => {
  it('rejects requests with no Authorization header', async () => {
    const res = await request(buildTestApp()).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('missing_token');
  });

  it('rejects requests with an invalid token', async () => {
    const res = await request(buildTestApp())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_token');
  });

  it('sets req.user and calls next for a valid token', async () => {
    const token = signAccessToken({ sub: 'user-1', role: 'individual' });
    const res = await request(buildTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'user-1', role: 'individual' });
  });
});

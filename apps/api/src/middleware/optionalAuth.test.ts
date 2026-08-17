import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { optionalAuth } from './optionalAuth.js';
import type { AuthenticatedRequest } from './requireAuth.js';
import { signAccessToken } from '../lib/tokens.js';

function buildTestApp() {
  const app = express();
  app.get('/maybe-protected', optionalAuth, (req, res) => {
    const authedReq = req as AuthenticatedRequest;
    res.status(200).json({ userId: authedReq.user?.id ?? null, role: authedReq.user?.role ?? null });
  });
  return app;
}

describe('optionalAuth', () => {
  it('proceeds with no user when there is no Authorization header', async () => {
    const res = await request(buildTestApp()).get('/maybe-protected');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: null, role: null });
  });

  it('proceeds with no user when the token is invalid', async () => {
    const res = await request(buildTestApp())
      .get('/maybe-protected')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: null, role: null });
  });

  it('sets req.user when a valid token is present', async () => {
    const token = signAccessToken({ sub: 'user-1', role: 'individual' });
    const res = await request(buildTestApp())
      .get('/maybe-protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'user-1', role: 'individual' });
  });
});

import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireRole } from './requireRole.js';
import type { AuthenticatedRequest } from './requireAuth.js';

function buildTestApp(userRole: 'individual' | 'company' | 'admin') {
  const app = express();
  app.use((req, _res, next) => {
    (req as AuthenticatedRequest).user = { id: 'user-1', role: userRole };
    next();
  });
  app.get('/admin-only', requireRole('admin'), (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe('requireRole', () => {
  it('allows a matching role through', async () => {
    const res = await request(buildTestApp('admin')).get('/admin-only');
    expect(res.status).toBe(200);
  });

  it('rejects a non-matching role with 403', async () => {
    const res = await request(buildTestApp('individual')).get('/admin-only');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden');
  });
});

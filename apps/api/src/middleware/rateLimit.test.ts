import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authRateLimit, AUTH_RATE_LIMIT_MAX } from './rateLimit.js';

describe('authRateLimit', () => {
  it('allows requests under the limit and blocks the next one with 429', async () => {
    const app = express();
    app.get('/limited', authRateLimit, (_req, res) => res.status(200).json({ ok: true }));

    let lastStatus = 0;
    for (let i = 0; i < AUTH_RATE_LIMIT_MAX + 1; i += 1) {
      const res = await request(app).get('/limited');
      lastStatus = res.status;
      if (i < AUTH_RATE_LIMIT_MAX) {
        expect(res.status).toBe(200);
      }
    }

    expect(lastStatus).toBe(429);
  });
});

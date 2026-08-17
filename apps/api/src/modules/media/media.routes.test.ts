import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { resetDb } from '../../../tests/helpers/resetDb.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import { signAccessToken } from '../../lib/tokens.js';
import { env } from '../../config/env.js';

const app = createApp();

async function createUserToken() {
  const user = await prisma.user.create({
    data: { email: 'ana@example.com', passwordHash: await hashPassword('irrelevant'), role: 'individual' },
  });
  return { userId: user.id, token: signAccessToken({ sub: user.id, role: 'individual' }) };
}

describe('POST /media/upload-url', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/media/upload-url').send({ mediaType: 'image' });
    expect(res.status).toBe(401);
  });

  it('rejects an invalid mediaType', async () => {
    const { token } = await createUserToken();
    const res = await request(app)
      .post('/media/upload-url')
      .set('Authorization', `Bearer ${token}`)
      .send({ mediaType: 'audio' });
    expect(res.status).toBe(400);
  });

  it('returns an object key prefixed with the caller id and a presigned upload URL', async () => {
    const { userId, token } = await createUserToken();
    const res = await request(app)
      .post('/media/upload-url')
      .set('Authorization', `Bearer ${token}`)
      .send({ mediaType: 'image' });

    expect(res.status).toBe(200);
    expect(res.body.objectKey.startsWith(`${userId}/`)).toBe(true);
    expect(res.body.objectKey.endsWith('.jpg')).toBe(true);
    expect(res.body.uploadUrl.startsWith(env.R2_ENDPOINT)).toBe(true);
  });
});

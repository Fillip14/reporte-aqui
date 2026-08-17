import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { resetDb } from '../../../tests/helpers/resetDb.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import { signAccessToken } from '../../lib/tokens.js';

const app = createApp();

export async function createUserToken(email = 'ana@example.com') {
  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword('irrelevant'), role: 'individual' },
  });
  return { userId: user.id, token: signAccessToken({ sub: user.id, role: 'individual' }) };
}

function validProblemBody(authorId: string) {
  return {
    title: 'Buraco grande na via',
    description: 'Um buraco grande e perigoso na rua principal, perto do ponto de ônibus.',
    location: 'Av. Principal, 500',
    media: [{ objectKey: `${authorId}/photo.jpg`, mediaType: 'image' }],
  };
}

describe('POST /problems', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/problems').send(validProblemBody('someone'));
    expect(res.status).toBe(401);
  });

  it('rejects a problem with no media', async () => {
    const { userId, token } = await createUserToken();
    const body = { ...validProblemBody(userId), media: [] };
    const res = await request(app).post('/problems').set('Authorization', `Bearer ${token}`).send(body);
    expect(res.status).toBe(400);
  });

  it('rejects a title shorter than 5 characters', async () => {
    const { userId, token } = await createUserToken();
    const body = { ...validProblemBody(userId), title: 'Oi' };
    const res = await request(app).post('/problems').set('Authorization', `Bearer ${token}`).send(body);
    expect(res.status).toBe(400);
  });

  it('creates an open problem with its media', async () => {
    const { userId, token } = await createUserToken();
    const res = await request(app)
      .post('/problems')
      .set('Authorization', `Bearer ${token}`)
      .send(validProblemBody(userId));

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('open');
    expect(res.body.authorId).toBe(userId);
    expect(res.body.media).toHaveLength(1);

    const stored = await prisma.problem.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(stored.status).toBe('open');
  });
});

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

async function createProblem(token: string, authorId: string, overrides: Partial<ReturnType<typeof validProblemBody>> = {}) {
  const res = await request(app)
    .post('/problems')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...validProblemBody(authorId), ...overrides });
  return res.body;
}

describe('GET /problems', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('lists problems without requiring authentication', async () => {
    const { userId, token } = await createUserToken();
    await createProblem(token, userId);

    const res = await request(app).get('/problems');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].hasVoted).toBe(false);
  });

  it('filters by status', async () => {
    const { userId, token } = await createUserToken();
    await createProblem(token, userId);

    const res = await request(app).get('/problems').query({ status: 'resolved' });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('searches by title/description text', async () => {
    const { userId, token } = await createUserToken();
    await createProblem(token, userId, { title: 'Semáforo quebrado na esquina' });

    const res = await request(app).get('/problems').query({ q: 'semáforo' });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });

  it('paginates results', async () => {
    const { userId, token } = await createUserToken();
    await createProblem(token, userId, { title: 'Problema um na via' });
    await createProblem(token, userId, { title: 'Problema dois na via' });

    const res = await request(app).get('/problems').query({ limit: 1, page: 2 });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(2);
  });
});

describe('GET /problems/:id', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('returns 404 for an unknown problem', async () => {
    const res = await request(app).get('/problems/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('returns problem detail without requiring authentication', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);

    const res = await request(app).get(`/problems/${problem.id}`);
    expect(res.status).toBe(200);
    expect(res.body.hasVoted).toBe(false);
    expect(res.body.media[0].url).toContain(res.body.media[0].objectKey);
  });
});

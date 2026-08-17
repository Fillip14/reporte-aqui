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

async function createAdminToken() {
  const admin = await prisma.user.create({
    data: { email: 'admin@example.com', passwordHash: await hashPassword('irrelevant'), role: 'admin' },
  });
  return signAccessToken({ sub: admin.id, role: 'admin' });
}

describe('POST /problems/:id/cancel', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('lets the author cancel an open problem', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);

    const res = await request(app)
      .post(`/problems/${problem.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('rejects cancellation by a non-author', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    const { token: otherToken } = await createUserToken('other@example.com');

    const res = await request(app)
      .post(`/problems/${problem.id}/cancel`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it('rejects cancelling an already-cancelled problem', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    await request(app).post(`/problems/${problem.id}/cancel`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post(`/problems/${problem.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });
});

describe('POST /problems/:id/resolve', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('lets the author resolve an open problem directly', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);

    const res = await request(app)
      .post(`/problems/${problem.id}/resolve`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('resolved');
    expect(res.body.resolvedById).toBe(userId);
  });

  it('lets an admin resolve someone else\'s open problem', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    const adminToken = await createAdminToken();

    const res = await request(app)
      .post(`/problems/${problem.id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('resolved');
  });

  it('rejects resolution by a non-author, non-admin user', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    const { token: otherToken } = await createUserToken('other@example.com');

    const res = await request(app)
      .post(`/problems/${problem.id}/resolve`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /problems/:id/vote', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('adds a vote on first call', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    const { token: voterToken } = await createUserToken('voter@example.com');

    const res = await request(app)
      .post(`/problems/${problem.id}/vote`)
      .set('Authorization', `Bearer ${voterToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ voted: true });
  });

  it('removes the vote on a second call (toggle)', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    const { token: voterToken } = await createUserToken('voter@example.com');

    await request(app).post(`/problems/${problem.id}/vote`).set('Authorization', `Bearer ${voterToken}`);
    const res = await request(app)
      .post(`/problems/${problem.id}/vote`)
      .set('Authorization', `Bearer ${voterToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ voted: false });
  });

  it('rejects the author voting on their own problem', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);

    const res = await request(app)
      .post(`/problems/${problem.id}/vote`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('rejects voting on a cancelled problem', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    await request(app).post(`/problems/${problem.id}/cancel`).set('Authorization', `Bearer ${token}`);
    const { token: voterToken } = await createUserToken('voter@example.com');

    const res = await request(app)
      .post(`/problems/${problem.id}/vote`)
      .set('Authorization', `Bearer ${voterToken}`);

    expect(res.status).toBe(409);
  });
});

describe('POST /problems/:id/resolution-proposals', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('lets a non-author propose a resolution and moves the problem to pending_verification', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    const { userId: proposerId, token: proposerToken } = await createUserToken('vizinho@example.com');

    const res = await request(app)
      .post(`/problems/${problem.id}/resolution-proposals`)
      .set('Authorization', `Bearer ${proposerToken}`)
      .send({ objectKey: `${proposerId}/evidence.jpg` });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');

    const stored = await prisma.problem.findUniqueOrThrow({ where: { id: problem.id } });
    expect(stored.status).toBe('pending_verification');
  });

  it('rejects the author proposing resolution of their own problem', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);

    const res = await request(app)
      .post(`/problems/${problem.id}/resolution-proposals`)
      .set('Authorization', `Bearer ${token}`)
      .send({ objectKey: `${userId}/evidence.jpg` });

    expect(res.status).toBe(403);
  });

  it('rejects a second pending proposal for the same problem', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    const { userId: firstProposerId, token: firstToken } = await createUserToken('primeiro@example.com');
    const { userId: secondProposerId, token: secondToken } = await createUserToken('segundo@example.com');

    await request(app)
      .post(`/problems/${problem.id}/resolution-proposals`)
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ objectKey: `${firstProposerId}/evidence.jpg` });

    const res = await request(app)
      .post(`/problems/${problem.id}/resolution-proposals`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ objectKey: `${secondProposerId}/evidence.jpg` });

    expect(res.status).toBe(409);
  });
});

describe('POST /problems/:id/rating', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('lets the author rate a resolved problem', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    await request(app).post(`/problems/${problem.id}/resolve`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post(`/problems/${problem.id}/rating`)
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 4, comment: 'Resolvido em dois dias.' });

    expect(res.status).toBe(201);
    expect(res.body.score).toBe(4);
  });

  it('rejects rating a problem that is not resolved yet', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);

    const res = await request(app)
      .post(`/problems/${problem.id}/rating`)
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 4 });

    expect(res.status).toBe(409);
  });

  it('rejects a second rating on the same problem', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    await request(app).post(`/problems/${problem.id}/resolve`).set('Authorization', `Bearer ${token}`);
    await request(app)
      .post(`/problems/${problem.id}/rating`)
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 5 });

    const res = await request(app)
      .post(`/problems/${problem.id}/rating`)
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 3 });

    expect(res.status).toBe(409);
  });

  it('rejects a rating from a user who is neither the author nor an admin', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    await request(app).post(`/problems/${problem.id}/resolve`).set('Authorization', `Bearer ${token}`);
    const { token: otherToken } = await createUserToken('other@example.com');

    const res = await request(app)
      .post(`/problems/${problem.id}/rating`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ score: 2 });

    expect(res.status).toBe(403);
  });

  it('rejects a score outside 1-5', async () => {
    const { userId, token } = await createUserToken();
    const problem = await createProblem(token, userId);
    await request(app).post(`/problems/${problem.id}/resolve`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post(`/problems/${problem.id}/rating`)
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 7 });

    expect(res.status).toBe(400);
  });
});

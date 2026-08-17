import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { resetDb } from '../../../tests/helpers/resetDb.js';
import { prisma } from '../../lib/prisma.js';

const app = createApp();

async function registerIndividual() {
  const res = await request(app).post('/auth/register/individual').send({
    email: 'ana@example.com',
    password: 'super-secret-1',
    fullName: 'Ana Silva',
  });
  return { accessToken: res.body.accessToken as string, userId: res.body.user.id as string };
}

async function registerCompany() {
  const res = await request(app).post('/auth/register/company').send({
    email: 'contato@empresa.com',
    password: 'super-secret-1',
    companyName: 'Empresa LTDA',
    cnpj: '12345678000199',
  });
  return { accessToken: res.body.accessToken as string, userId: res.body.user.id as string };
}

describe('GET /me', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
  });

  it('returns the individual profile for the authenticated user', async () => {
    const { accessToken } = await registerIndividual();
    const res = await request(app).get('/me').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('ana@example.com');
    expect(res.body.individualProfile).toEqual({ fullName: 'Ana Silva' });
  });
});

describe('PATCH /me', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('updates the individual full name', async () => {
    const { accessToken } = await registerIndividual();
    const res = await request(app)
      .patch('/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fullName: 'Ana Souza' });

    expect(res.status).toBe(200);
    expect(res.body.individualProfile.fullName).toBe('Ana Souza');
  });

  it('resets an approved company back to pending when the CNPJ changes', async () => {
    const { accessToken, userId } = await registerCompany();
    await prisma.companyProfile.update({
      where: { userId },
      data: { verificationStatus: 'approved', verifiedAt: new Date() },
    });

    const res = await request(app)
      .patch('/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ cnpj: '98765432000188' });

    expect(res.status).toBe(200);
    expect(res.body.companyProfile.verificationStatus).toBe('pending');
    expect(res.body.companyProfile.cnpj).toBe('98765432000188');
  });
});

describe('DELETE /me', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('soft deletes and anonymizes the account, and revokes refresh tokens', async () => {
    const { accessToken, userId } = await registerIndividual();

    const res = await request(app).delete('/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(204);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { individualProfile: true },
    });
    expect(user.status).toBe('deleted');
    expect(user.email).toBe(`deleted-${userId}@removed.local`);
    expect(user.individualProfile?.fullName).toBe('Usuário removido');

    const tokens = await prisma.refreshToken.findMany({ where: { userId } });
    expect(tokens.every((t) => t.revokedAt !== null)).toBe(true);

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@example.com', password: 'super-secret-1' });
    expect(loginRes.status).toBe(401);
  });
});

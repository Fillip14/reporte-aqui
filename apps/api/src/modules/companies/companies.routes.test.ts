import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { resetDb } from '../../../tests/helpers/resetDb.js';
import { prisma } from '../../lib/prisma.js';

const app = createApp();

async function registerCompany(email: string, companyName: string, cnpj: string) {
  const res = await request(app).post('/auth/register/company').send({
    email,
    password: 'super-secret-1',
    companyName,
    cnpj,
  });
  return res.body.user.id as string;
}

async function approveCompany(userId: string) {
  const profile = await prisma.companyProfile.findUniqueOrThrow({ where: { userId } });
  await prisma.companyProfile.update({
    where: { id: profile.id },
    data: { verificationStatus: 'approved' },
  });
}

describe('GET /companies', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('lists only approved companies, sorted by name', async () => {
    const zUserId = await registerCompany('z@example.com', 'Zebra LTDA', '11111111000101');
    const aUserId = await registerCompany('a@example.com', 'Alfa LTDA', '22222222000102');
    await registerCompany('pending@example.com', 'Pendente LTDA', '33333333000103');
    await approveCompany(zUserId);
    await approveCompany(aUserId);

    const res = await request(app).get('/companies');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: expect.any(String), companyName: 'Alfa LTDA' },
      { id: expect.any(String), companyName: 'Zebra LTDA' },
    ]);
  });

  it('returns an empty list when there are no approved companies', async () => {
    const res = await request(app).get('/companies');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/companies');
    expect(res.status).toBe(200);
  });
});

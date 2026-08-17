import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { resetDb } from '../../../tests/helpers/resetDb.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import { signAccessToken } from '../../lib/tokens.js';

const app = createApp();

async function createAdminToken() {
  const admin = await prisma.user.create({
    data: { email: 'admin@example.com', passwordHash: await hashPassword('irrelevant'), role: 'admin' },
  });
  return signAccessToken({ sub: admin.id, role: 'admin' });
}

async function registerCompany() {
  const res = await request(app).post('/auth/register/company').send({
    email: 'contato@empresa.com',
    password: 'super-secret-1',
    companyName: 'Empresa LTDA',
    cnpj: '12345678000199',
  });
  return res.body.user.id as string;
}

describe('admin company verification routes', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('rejects non-admin access with 403', async () => {
    const { accessToken } = (await request(app).post('/auth/register/individual').send({
      email: 'ana@example.com',
      password: 'super-secret-1',
      fullName: 'Ana Silva',
    })).body;

    const res = await request(app)
      .get('/admin/companies/pending')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it('lists pending companies for an admin', async () => {
    await registerCompany();
    const adminToken = await createAdminToken();

    const res = await request(app)
      .get('/admin/companies/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].cnpj).toBe('12345678000199');
  });

  it('approves a pending company', async () => {
    const companyUserId = await registerCompany();
    const adminToken = await createAdminToken();
    const companyProfile = await prisma.companyProfile.findUniqueOrThrow({
      where: { userId: companyUserId },
    });

    const res = await request(app)
      .post(`/admin/companies/${companyProfile.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.verificationStatus).toBe('approved');
  });

  it('rejects a pending company with a reason', async () => {
    const companyUserId = await registerCompany();
    const adminToken = await createAdminToken();
    const companyProfile = await prisma.companyProfile.findUniqueOrThrow({
      where: { userId: companyUserId },
    });

    const res = await request(app)
      .post(`/admin/companies/${companyProfile.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'CNPJ não confere com o nome informado' });

    expect(res.status).toBe(200);
    expect(res.body.verificationStatus).toBe('rejected');
    expect(res.body.rejectionReason).toBe('CNPJ não confere com o nome informado');
  });
});

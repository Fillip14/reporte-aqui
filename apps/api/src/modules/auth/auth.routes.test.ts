import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { resetDb } from '../../../tests/helpers/resetDb.js';
import { prisma } from '../../lib/prisma.js';

const app = createApp();

describe('POST /auth/register/individual', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('creates an individual user and returns an access token plus refresh cookie', async () => {
    const res = await request(app).post('/auth/register/individual').send({
      email: 'ana@example.com',
      password: 'super-secret-1',
      fullName: 'Ana Silva',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'ana@example.com', role: 'individual' });
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=/);

    const stored = await prisma.user.findUnique({
      where: { email: 'ana@example.com' },
      include: { individualProfile: true },
    });
    expect(stored?.individualProfile?.fullName).toBe('Ana Silva');
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/auth/register/individual').send({
      email: 'ana@example.com',
      password: 'super-secret-1',
      fullName: 'Ana Silva',
    });

    const res = await request(app).post('/auth/register/individual').send({
      email: 'ana@example.com',
      password: 'another-secret-1',
      fullName: 'Ana Duplicate',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('email_already_registered');
  });

  it('rejects an invalid payload with 400', async () => {
    const res = await request(app).post('/auth/register/individual').send({
      email: 'not-an-email',
      password: 'short',
      fullName: '',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/register/company', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('creates a company user with pending verification', async () => {
    const res = await request(app).post('/auth/register/company').send({
      email: 'contato@empresa.com',
      password: 'super-secret-1',
      companyName: 'Empresa LTDA',
      cnpj: '12345678000199',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'contato@empresa.com', role: 'company' });

    const stored = await prisma.companyProfile.findUnique({ where: { cnpj: '12345678000199' } });
    expect(stored?.verificationStatus).toBe('pending');
  });

  it('rejects a duplicate CNPJ with 409', async () => {
    await request(app).post('/auth/register/company').send({
      email: 'contato@empresa.com',
      password: 'super-secret-1',
      companyName: 'Empresa LTDA',
      cnpj: '12345678000199',
    });

    const res = await request(app).post('/auth/register/company').send({
      email: 'outro@empresa.com',
      password: 'super-secret-1',
      companyName: 'Outra Empresa LTDA',
      cnpj: '12345678000199',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('cnpj_already_registered');
  });
});

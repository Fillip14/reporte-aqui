import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { login, registerIndividual, registerCompany, refreshSession, logout } from './auth';

describe('auth api', () => {
  it('login posts credentials and returns the session', async () => {
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ email: 'a@b.com', password: 'secret123' });
        return HttpResponse.json({
          user: { id: '1', email: 'a@b.com', role: 'individual' },
          accessToken: 'token',
        });
      }),
    );

    const result = await login({ email: 'a@b.com', password: 'secret123' });
    expect(result.user.email).toBe('a@b.com');
    expect(result.accessToken).toBe('token');
  });

  it('registerIndividual posts to the individual endpoint', async () => {
    server.use(
      http.post('/api/auth/register/individual', () =>
        HttpResponse.json(
          { user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'token' },
          { status: 201 },
        ),
      ),
    );

    const result = await registerIndividual({ email: 'a@b.com', password: 'secret123', fullName: 'Ana' });
    expect(result.user.role).toBe('individual');
  });

  it('registerCompany posts to the company endpoint', async () => {
    server.use(
      http.post('/api/auth/register/company', () =>
        HttpResponse.json(
          { user: { id: '2', email: 'c@b.com', role: 'company' }, accessToken: 'token' },
          { status: 201 },
        ),
      ),
    );

    const result = await registerCompany({
      email: 'c@b.com',
      password: 'secret123',
      companyName: 'Acme',
      cnpj: '12345678901234',
    });
    expect(result.user.role).toBe('company');
  });

  it('refreshSession posts with no body and returns the session', async () => {
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'new-token' }),
      ),
    );

    const result = await refreshSession();
    expect(result.accessToken).toBe('new-token');
  });

  it('logout returns void on 204', async () => {
    server.use(http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })));
    await expect(logout()).resolves.toBeUndefined();
  });
});

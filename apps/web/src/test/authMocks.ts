import { http, HttpResponse } from 'msw';
import { server } from './server';
import type { AuthUser } from '../api/auth';

export function mockLoggedOut() {
  server.use(
    http.post('/api/auth/refresh', () => HttpResponse.json({ error: 'missing_refresh_token' }, { status: 401 })),
  );
}

export function mockLoggedIn(user: AuthUser, accessToken = 'test-access-token') {
  server.use(http.post('/api/auth/refresh', () => HttpResponse.json({ user, accessToken })));
}

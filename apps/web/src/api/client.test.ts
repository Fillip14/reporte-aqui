import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { apiFetch, ApiError, setAccessToken, setRefreshHandler } from './client';

describe('apiFetch', () => {
  beforeEach(() => {
    setAccessToken(null);
    setRefreshHandler(null);
  });

  it('sends the access token as a Bearer header when set', async () => {
    setAccessToken('token-123');
    let receivedAuth: string | null = null;
    server.use(
      http.get('/api/ping', ({ request }) => {
        receivedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiFetch('/ping');
    expect(receivedAuth).toBe('Bearer token-123');
  });

  it('omits the Authorization header when no token is set', async () => {
    let receivedAuth: string | null = 'unset';
    server.use(
      http.get('/api/ping', ({ request }) => {
        receivedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiFetch('/ping');
    expect(receivedAuth).toBeNull();
  });

  it('retries once after a successful refresh on 401', async () => {
    let callCount = 0;
    server.use(
      http.get('/api/secure', () => {
        callCount += 1;
        return callCount === 1
          ? HttpResponse.json({ error: 'invalid_token' }, { status: 401 })
          : HttpResponse.json({ ok: true });
      }),
    );
    setRefreshHandler(async () => {
      setAccessToken('new-token');
      return 'new-token';
    });

    const result = await apiFetch<{ ok: boolean }>('/secure');
    expect(result).toEqual({ ok: true });
    expect(callCount).toBe(2);
  });

  it('throws ApiError when refresh fails to produce a new token', async () => {
    server.use(
      http.get('/api/secure', () => HttpResponse.json({ error: 'invalid_token' }, { status: 401 })),
    );
    setRefreshHandler(async () => null);

    await expect(apiFetch('/secure')).rejects.toBeInstanceOf(ApiError);
  });

  it('does not call the refresh handler when skipAuthRetry is set', async () => {
    const refreshHandler = vi.fn(async () => 'token');
    setRefreshHandler(refreshHandler);
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ error: 'invalid_refresh_token' }, { status: 401 }),
      ),
    );

    await expect(
      apiFetch('/auth/refresh', { method: 'POST', skipAuthRetry: true }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(refreshHandler).not.toHaveBeenCalled();
  });

  it('throws ApiError immediately for non-401 errors', async () => {
    server.use(http.get('/api/missing', () => HttpResponse.json({ error: 'not_found' }, { status: 404 })));

    await expect(apiFetch('/missing')).rejects.toMatchObject({ status: 404, code: 'not_found' });
  });

  it('returns undefined for 204 responses', async () => {
    server.use(http.delete('/api/thing', () => new HttpResponse(null, { status: 204 })));

    const result = await apiFetch('/thing', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });
});

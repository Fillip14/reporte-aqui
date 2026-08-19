import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../test/server';
import { AuthProvider, useAuth } from './AuthContext';

function Consumer() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p>loading</p>;
  return <p>{user ? `logged in: ${user.email}` : 'logged out'}</p>;
}

function ConsumerWithLogout() {
  const { user, isLoading, logout } = useAuth();
  if (isLoading) return <p>loading</p>;
  return (
    <>
      <p>{user ? `logged in: ${user.email}` : 'logged out'}</p>
      <button onClick={() => logout().catch(() => {})}>logout</button>
    </>
  );
}

function renderConsumer() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AuthProvider boot', () => {
  it('sets user to null when the refresh cookie is missing', async () => {
    server.use(
      http.post('/api/auth/refresh', () => HttpResponse.json({ error: 'missing_refresh_token' }, { status: 401 })),
    );

    renderConsumer();
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument());
  });

  it('sets user from a successful boot refresh', async () => {
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'token' }),
      ),
    );

    renderConsumer();
    await waitFor(() => expect(screen.getByText('logged in: a@b.com')).toBeInTheDocument());
  });
});

describe('AuthProvider logout', () => {
  it('clears local session state even if backend call fails', async () => {
    const queryClient = new QueryClient();
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'token' }),
      ),
      http.post('/api/auth/logout', () => HttpResponse.json({ error: 'server_error' }, { status: 500 })),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConsumerWithLogout />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('logged in: a@b.com')).toBeInTheDocument());

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    logoutButton.click();

    // Despite the backend call failing, local state should be cleared
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument());
  });
});

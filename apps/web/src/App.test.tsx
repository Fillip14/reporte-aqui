import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from './test/server';
import { mockLoggedIn, mockLoggedOut } from './test/authMocks';
import { AuthProvider } from './auth/AuthContext';
import App from './App';

function renderApp() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders the feed at the root route', async () => {
    server.use(
      http.post('/api/auth/refresh', () => HttpResponse.json({ error: 'missing_refresh_token' }, { status: 401 })),
      http.get('/api/problems', () => HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 })),
    );

    renderApp();

    await waitFor(() => expect(screen.getByText('Problemas reportados')).toBeInTheDocument());
  });

  it('shows Entrar/Cadastrar links in the nav when logged out', async () => {
    mockLoggedOut();
    server.use(http.get('/api/problems', () => HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 })));

    renderApp();

    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastrar' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Meu perfil' })).not.toBeInTheDocument();
  });

  it('shows Meu perfil and logs out back to logged-out nav state when logged in', async () => {
    mockLoggedIn({ id: '1', email: 'a@b.com', role: 'individual' });
    server.use(
      http.get('/api/problems', () => HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 })),
      http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
    );

    renderApp();

    expect(await screen.findByRole('link', { name: 'Meu perfil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Novo problema' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Meu perfil' })).not.toBeInTheDocument();
  });
});

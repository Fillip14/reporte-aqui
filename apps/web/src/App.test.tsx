import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from './test/server';
import { AuthProvider } from './auth/AuthContext';
import App from './App';

describe('App', () => {
  it('renders the feed at the root route', async () => {
    server.use(
      http.post('/api/auth/refresh', () => HttpResponse.json({ error: 'missing_refresh_token' }, { status: 401 })),
      http.get('/api/problems', () => HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 })),
    );
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Problemas reportados')).toBeInTheDocument());
  });
});

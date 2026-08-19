import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedOut, mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import FeedPage from './FeedPage';

const sampleProblem = {
  id: 'abc',
  authorId: 'author-1',
  title: 'Buraco na rua',
  description: 'd'.repeat(20),
  location: 'Rua X',
  status: 'open',
  resolvedAt: null,
  resolvedById: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  media: [],
  voteCount: 3,
  hasVoted: false,
};

describe('FeedPage', () => {
  it('lists problems returned by the API', async () => {
    mockLoggedOut();
    server.use(
      http.get('/api/problems', () => HttpResponse.json({ items: [sampleProblem], page: 1, limit: 20, total: 1 })),
    );

    renderWithProviders(<FeedPage />, { route: '/' });

    expect(await screen.findByText('Buraco na rua')).toBeInTheDocument();
  });

  it('shows the empty state when there are no problems', async () => {
    mockLoggedOut();
    server.use(http.get('/api/problems', () => HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 })));

    renderWithProviders(<FeedPage />, { route: '/' });

    expect(await screen.findByText('Nenhum problema encontrado.')).toBeInTheDocument();
  });

  it('hides the vote button for the problem author', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(
      http.get('/api/problems', () => HttpResponse.json({ items: [sampleProblem], page: 1, limit: 20, total: 1 })),
    );

    renderWithProviders(<FeedPage />, { route: '/' });

    await screen.findByText('Buraco na rua');
    expect(screen.queryByRole('button', { name: 'Votar' })).not.toBeInTheDocument();
  });

  it('lets a non-author vote', async () => {
    mockLoggedIn({ id: 'voter-1', email: 'v@b.com', role: 'individual' });
    let voteCalled = false;
    server.use(
      http.get('/api/problems', () => HttpResponse.json({ items: [sampleProblem], page: 1, limit: 20, total: 1 })),
      http.post('/api/problems/abc/vote', () => {
        voteCalled = true;
        return HttpResponse.json({ voted: true });
      }),
    );

    renderWithProviders(<FeedPage />, { route: '/' });

    const voteButton = await screen.findByRole('button', { name: 'Votar' });
    await userEvent.click(voteButton);

    await waitFor(() => expect(voteCalled).toBe(true));
  });

  it('requests the selected status filter', async () => {
    mockLoggedOut();
    let requestedStatus: string | null = null;
    server.use(
      http.get('/api/problems', ({ request }) => {
        requestedStatus = new URL(request.url).searchParams.get('status');
        return HttpResponse.json({ items: [sampleProblem], page: 1, limit: 20, total: 1 });
      }),
    );

    renderWithProviders(<FeedPage />, { route: '/' });
    await screen.findByText('Buraco na rua');

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'resolved');

    await waitFor(() => expect(requestedStatus).toBe('resolved'));
  });

  it('requests the typed search text', async () => {
    mockLoggedOut();
    let requestedQ: string | null = null;
    server.use(
      http.get('/api/problems', ({ request }) => {
        requestedQ = new URL(request.url).searchParams.get('q');
        return HttpResponse.json({ items: [sampleProblem], page: 1, limit: 20, total: 1 });
      }),
    );

    renderWithProviders(<FeedPage />, { route: '/' });
    await screen.findByText('Buraco na rua');

    await userEvent.type(screen.getByLabelText('Buscar'), 'buraco');

    await waitFor(() => expect(requestedQ).toBe('buraco'));
  });

  it('requests the selected sort order', async () => {
    mockLoggedOut();
    let requestedSort: string | null = null;
    server.use(
      http.get('/api/problems', ({ request }) => {
        requestedSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ items: [sampleProblem], page: 1, limit: 20, total: 1 });
      }),
    );

    renderWithProviders(<FeedPage />, { route: '/' });
    await screen.findByText('Buraco na rua');

    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'top');

    await waitFor(() => expect(requestedSort).toBe('top'));
  });

  it('shows an error message when the problems query fails', async () => {
    mockLoggedOut();
    server.use(http.get('/api/problems', () => HttpResponse.json({ error: 'server_error' }, { status: 500 })));

    renderWithProviders(<FeedPage />, { route: '/' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os problemas.');
  });
});

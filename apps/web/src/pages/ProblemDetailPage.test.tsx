import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import ProblemDetailPage from './ProblemDetailPage';

function problem(overrides: Record<string, unknown> = {}) {
  return {
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
    rating: null,
    ...overrides,
  };
}

describe('ProblemDetailPage', () => {
  it('shows cancel and resolve for the author on an open problem, hides vote/propose', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(http.get('/api/problems/abc', () => HttpResponse.json(problem())));

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar como resolvido' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Votar' })).not.toBeInTheDocument();
    expect(screen.queryByText('Propor resolução')).not.toBeInTheDocument();
  });

  it('shows vote and propose-resolution for a non-author on an open problem', async () => {
    mockLoggedIn({ id: 'voter-1', email: 'v@b.com', role: 'individual' });
    server.use(http.get('/api/problems/abc', () => HttpResponse.json(problem())));

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    expect(screen.getByRole('button', { name: 'Votar' })).toBeInTheDocument();
    expect(screen.getByText('Propor resolução')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('submits a resolution proposal by uploading a file first', async () => {
    mockLoggedIn({ id: 'voter-1', email: 'v@b.com', role: 'individual' });
    let proposalCalled = false;
    server.use(
      http.get('/api/problems/abc', () => HttpResponse.json(problem())),
      http.post('/api/media/upload-url', () =>
        HttpResponse.json({ objectKey: 'voter-1/a.jpg', uploadUrl: 'https://r2.example.com/voter-1/a.jpg' }),
      ),
      http.put('https://r2.example.com/voter-1/a.jpg', () => new HttpResponse(null, { status: 200 })),
      http.post('/api/problems/abc/resolution-proposals', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ objectKey: 'voter-1/a.jpg' });
        proposalCalled = true;
        return HttpResponse.json({ id: 'p1', status: 'pending' }, { status: 201 });
      }),
    );

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByLabelText('Foto de evidência'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar proposta' }));

    await waitFor(() => expect(proposalCalled).toBe(true));
  });

  it('shows a rating form for the author on a resolved, unrated problem', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(http.get('/api/problems/abc', () => HttpResponse.json(problem({ status: 'resolved' }))));

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    expect(screen.getByRole('button', { name: 'Enviar avaliação' })).toBeInTheDocument();
  });

  it('shows the existing rating instead of the form when already rated', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(
      http.get('/api/problems/abc', () =>
        HttpResponse.json(problem({ status: 'resolved', rating: { id: 'r1', score: 4, comment: 'Bom' } })),
      ),
    );

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    expect(screen.getByText('Nota: 4/5')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar avaliação' })).not.toBeInTheDocument();
  });

  it('shows an error alert when voting fails', async () => {
    mockLoggedIn({ id: 'voter-1', email: 'v@b.com', role: 'individual' });
    server.use(
      http.get('/api/problems/abc', () => HttpResponse.json(problem())),
      http.post('/api/problems/abc/vote', () => HttpResponse.json({ error: 'unknown_error' }, { status: 500 })),
    );

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    await userEvent.click(screen.getByRole('button', { name: 'Votar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível registrar o voto. Tente novamente.');
  });

  it('shows an error alert when cancelling fails', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(
      http.get('/api/problems/abc', () => HttpResponse.json(problem())),
      http.post('/api/problems/abc/cancel', () => HttpResponse.json({ error: 'unknown_error' }, { status: 500 })),
    );

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível cancelar o problema. Tente novamente.',
    );
  });

  it('shows an error alert when resolving fails', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(
      http.get('/api/problems/abc', () => HttpResponse.json(problem())),
      http.post('/api/problems/abc/resolve', () => HttpResponse.json({ error: 'unknown_error' }, { status: 500 })),
    );

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como resolvido' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível marcar o problema como resolvido. Tente novamente.',
    );
  });

  it('shows an error alert when rating submission fails', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(
      http.get('/api/problems/abc', () => HttpResponse.json(problem({ status: 'resolved' }))),
      http.post('/api/problems/abc/rating', () => HttpResponse.json({ error: 'unknown_error' }, { status: 500 })),
    );

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível enviar a avaliação. Tente novamente.',
    );
  });
});

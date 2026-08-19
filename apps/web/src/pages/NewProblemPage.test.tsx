import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import NewProblemPage from './NewProblemPage';

describe('NewProblemPage', () => {
  it('uploads media then creates the problem', async () => {
    mockLoggedIn({ id: 'u1', email: 'a@b.com', role: 'individual' });
    let createCalled = false;
    server.use(
      http.post('/api/media/upload-url', () =>
        HttpResponse.json({ objectKey: 'u1/a.jpg', uploadUrl: 'https://r2.example.com/u1/a.jpg' }),
      ),
      http.put('https://r2.example.com/u1/a.jpg', () => new HttpResponse(null, { status: 200 })),
      http.post('/api/problems', async ({ request }) => {
        const body = (await request.json()) as {
          title: string;
          description: string;
          location: string;
          media: { objectKey: string; mediaType: string }[];
        };
        expect(body.media).toEqual([{ objectKey: 'u1/a.jpg', mediaType: 'image' }]);
        createCalled = true;
        return HttpResponse.json({ id: 'new-id', ...body, status: 'open' }, { status: 201 });
      }),
    );

    renderWithProviders(<NewProblemPage />, { route: '/problems/new' });

    await userEvent.type(screen.getByLabelText('Título'), 'Buraco na rua principal');
    await userEvent.type(screen.getByLabelText('Descrição'), 'd'.repeat(20));
    await userEvent.type(screen.getByLabelText('Localização'), 'Rua X, 100');
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByLabelText('Fotos/vídeos (1 a 5 arquivos)'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(createCalled).toBe(true));
  });

  it('shows an error when no media is selected', async () => {
    mockLoggedIn({ id: 'u1', email: 'a@b.com', role: 'individual' });

    renderWithProviders(<NewProblemPage />, { route: '/problems/new' });

    await userEvent.type(screen.getByLabelText('Título'), 'Buraco na rua principal');
    await userEvent.type(screen.getByLabelText('Descrição'), 'd'.repeat(20));
    await userEvent.type(screen.getByLabelText('Localização'), 'Rua X, 100');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Adicione ao menos uma foto ou vídeo.');
  });

  it('shows an error when the create request fails', async () => {
    mockLoggedIn({ id: 'u1', email: 'a@b.com', role: 'individual' });
    server.use(
      http.post('/api/media/upload-url', () =>
        HttpResponse.json({ objectKey: 'u1/a.jpg', uploadUrl: 'https://r2.example.com/u1/a.jpg' }),
      ),
      http.put('https://r2.example.com/u1/a.jpg', () => new HttpResponse(null, { status: 200 })),
      http.post('/api/problems', () => HttpResponse.json({ error: 'server_error' }, { status: 500 })),
    );

    renderWithProviders(<NewProblemPage />, { route: '/problems/new' });

    await userEvent.type(screen.getByLabelText('Título'), 'Buraco na rua principal');
    await userEvent.type(screen.getByLabelText('Descrição'), 'd'.repeat(20));
    await userEvent.type(screen.getByLabelText('Localização'), 'Rua X, 100');
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByLabelText('Fotos/vídeos (1 a 5 arquivos)'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível criar o problema. Tente novamente.');
  });
});

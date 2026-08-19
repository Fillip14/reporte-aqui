import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import ProfilePage from './ProfilePage';

const individualUser = { id: '1', email: 'a@b.com', role: 'individual' as const };

describe('ProfilePage', () => {
  it('shows and updates the individual profile', async () => {
    mockLoggedIn(individualUser);
    server.use(
      http.get('/api/me', () =>
        HttpResponse.json({
          id: '1',
          email: 'a@b.com',
          role: 'individual',
          individualProfile: { fullName: 'Ana' },
          companyProfile: null,
        }),
      ),
      http.patch('/api/me', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ fullName: 'Ana Paula' });
        return HttpResponse.json({
          id: '1',
          email: 'a@b.com',
          role: 'individual',
          individualProfile: { fullName: 'Ana Paula' },
          companyProfile: null,
        });
      }),
    );

    renderWithProviders(<ProfilePage />, { route: '/profile' });

    const input = await screen.findByLabelText('Nome completo');
    expect(input).toHaveValue('Ana');

    await userEvent.clear(input);
    await userEvent.type(input, 'Ana Paula');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(input).toHaveValue('Ana Paula'));
  });

  it('deletes the account and calls logout', async () => {
    mockLoggedIn(individualUser);
    let deleteCalled = false;
    let logoutCalled = false;
    server.use(
      http.get('/api/me', () =>
        HttpResponse.json({
          id: '1',
          email: 'a@b.com',
          role: 'individual',
          individualProfile: { fullName: 'Ana' },
          companyProfile: null,
        }),
      ),
      http.delete('/api/me', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.post('/api/auth/logout', () => {
        logoutCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<ProfilePage />, { route: '/profile' });

    await screen.findByLabelText('Nome completo');
    await userEvent.click(screen.getByRole('button', { name: 'Excluir conta' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    await waitFor(() => expect(logoutCalled).toBe(true));
  });

  it('shows an error message when updating the profile fails', async () => {
    mockLoggedIn(individualUser);
    server.use(
      http.get('/api/me', () =>
        HttpResponse.json({
          id: '1',
          email: 'a@b.com',
          role: 'individual',
          individualProfile: { fullName: 'Ana' },
          companyProfile: null,
        }),
      ),
      http.patch('/api/me', () => HttpResponse.json({ error: 'invalid_input' }, { status: 400 })),
    );

    renderWithProviders(<ProfilePage />, { route: '/profile' });

    const input = await screen.findByLabelText('Nome completo');
    await userEvent.clear(input);
    await userEvent.type(input, 'Ana Paula');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Verifique os dados informados.'));
  });

  it('shows an error message when deleting the account fails', async () => {
    mockLoggedIn(individualUser);
    server.use(
      http.get('/api/me', () =>
        HttpResponse.json({
          id: '1',
          email: 'a@b.com',
          role: 'individual',
          individualProfile: { fullName: 'Ana' },
          companyProfile: null,
        }),
      ),
      http.delete('/api/me', () => HttpResponse.json({ error: 'unknown_error' }, { status: 500 })),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<ProfilePage />, { route: '/profile' });

    await screen.findByLabelText('Nome completo');
    await userEvent.click(screen.getByRole('button', { name: 'Excluir conta' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível excluir a conta. Tente novamente.'),
    );
  });
});

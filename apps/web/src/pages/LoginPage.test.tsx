import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedOut } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('logs in with valid credentials', async () => {
    mockLoggedOut();
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'token' }),
      ),
    );

    renderWithProviders(<LoginPage />, { route: '/login' });

    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('shows an error on invalid credentials', async () => {
    mockLoggedOut();
    server.use(
      http.post('/api/auth/login', () => HttpResponse.json({ error: 'invalid_credentials' }, { status: 401 })),
    );

    renderWithProviders(<LoginPage />, { route: '/login' });

    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
  });
});

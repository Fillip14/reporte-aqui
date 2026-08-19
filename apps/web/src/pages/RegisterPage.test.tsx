import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedOut } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import RegisterPage from './RegisterPage';

describe('RegisterPage', () => {
  it('registers an individual and redirects home', async () => {
    mockLoggedOut();
    server.use(
      http.post('/api/auth/register/individual', () =>
        HttpResponse.json(
          { user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'token' },
          { status: 201 },
        ),
      ),
    );

    renderWithProviders(<RegisterPage />, { route: '/register' });

    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123');
    await userEvent.type(screen.getByLabelText('Nome completo'), 'Ana');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('shows an error when the email is already registered', async () => {
    mockLoggedOut();
    server.use(
      http.post('/api/auth/register/individual', () =>
        HttpResponse.json({ error: 'email_already_registered' }, { status: 409 }),
      ),
    );

    renderWithProviders(<RegisterPage />, { route: '/register' });

    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123');
    await userEvent.type(screen.getByLabelText('Nome completo'), 'Ana');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este e-mail já está cadastrado.');
  });

  it('switches to the company fields when selecting empresa', async () => {
    mockLoggedOut();
    renderWithProviders(<RegisterPage />, { route: '/register' });

    await userEvent.click(screen.getByLabelText('Empresa'));

    expect(screen.getByLabelText('Nome da empresa')).toBeInTheDocument();
    expect(screen.getByLabelText('CNPJ')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome completo')).not.toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import AdminPage from './AdminPage';

const sampleCompany = {
  id: 'company-1',
  companyName: 'Empresa LTDA',
  cnpj: '12345678000199',
  user: { email: 'contato@empresa.com' },
};

const sampleProposal = {
  id: 'proposal-1',
  problemId: 'problem-1',
  mediaUrl: 'https://media.example.com/evidence.jpg',
  problem: { title: 'Buraco na rua' },
};

function mockAdminApi({ companies = [sampleCompany], proposals = [sampleProposal] } = {}) {
  server.use(
    http.get('/api/admin/companies/pending', () => HttpResponse.json(companies)),
    http.get('/api/admin/resolution-proposals/pending', () => HttpResponse.json(proposals)),
  );
}

describe('AdminPage', () => {
  it('lists pending companies and proposals returned by the API', async () => {
    mockLoggedIn({ id: 'admin-1', email: 'admin@b.com', role: 'admin' });
    mockAdminApi();

    renderWithProviders(<AdminPage />, { route: '/admin' });

    expect(await screen.findByText('Empresa LTDA')).toBeInTheDocument();
    expect(screen.getByText('contato@empresa.com')).toBeInTheDocument();
    expect(screen.getByText('Buraco na rua')).toBeInTheDocument();
  });

  it('shows empty states when there is nothing pending', async () => {
    mockLoggedIn({ id: 'admin-1', email: 'admin@b.com', role: 'admin' });
    mockAdminApi({ companies: [], proposals: [] });

    renderWithProviders(<AdminPage />, { route: '/admin' });

    expect(await screen.findByText('Nenhuma empresa pendente.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma proposta pendente.')).toBeInTheDocument();
  });

  it('approves a pending company', async () => {
    mockLoggedIn({ id: 'admin-1', email: 'admin@b.com', role: 'admin' });
    mockAdminApi();
    let approveCalled = false;
    server.use(
      http.post('/api/admin/companies/company-1/approve', () => {
        approveCalled = true;
        return HttpResponse.json({ ...sampleCompany, verificationStatus: 'approved' });
      }),
    );

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByText('Empresa LTDA');

    await userEvent.click(screen.getAllByRole('button', { name: 'Aprovar' })[0]);

    await waitFor(() => expect(approveCalled).toBe(true));
  });

  it('rejects a pending company with a typed reason', async () => {
    mockLoggedIn({ id: 'admin-1', email: 'admin@b.com', role: 'admin' });
    mockAdminApi();
    let sentReason: string | null = null;
    server.use(
      http.post('/api/admin/companies/company-1/reject', async ({ request }) => {
        const body = (await request.json()) as { reason: string };
        sentReason = body.reason;
        return HttpResponse.json({ ...sampleCompany, verificationStatus: 'rejected' });
      }),
    );

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByText('Empresa LTDA');

    await userEvent.click(screen.getAllByRole('button', { name: 'Rejeitar' })[0]);
    await userEvent.type(screen.getByLabelText('Motivo da rejeição'), 'CNPJ inválido');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar rejeição' }));

    await waitFor(() => expect(sentReason).toBe('CNPJ inválido'));
  });

  it('shows an error alert when approving a company fails', async () => {
    mockLoggedIn({ id: 'admin-1', email: 'admin@b.com', role: 'admin' });
    mockAdminApi();
    server.use(
      http.post('/api/admin/companies/company-1/approve', () =>
        HttpResponse.json({ error: 'unknown_error' }, { status: 500 }),
      ),
    );

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByText('Empresa LTDA');

    await userEvent.click(screen.getAllByRole('button', { name: 'Aprovar' })[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível atualizar a empresa. Tente novamente.',
    );
  });

  it('approves a pending resolution proposal', async () => {
    mockLoggedIn({ id: 'admin-1', email: 'admin@b.com', role: 'admin' });
    mockAdminApi();
    let approveCalled = false;
    server.use(
      http.post('/api/admin/resolution-proposals/proposal-1/approve', () => {
        approveCalled = true;
        return HttpResponse.json({ ...sampleProposal, status: 'approved' });
      }),
    );

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByText('Buraco na rua');

    const approveButtons = screen.getAllByRole('button', { name: 'Aprovar' });
    await userEvent.click(approveButtons[approveButtons.length - 1]);

    await waitFor(() => expect(approveCalled).toBe(true));
  });

  it('rejects a pending resolution proposal', async () => {
    mockLoggedIn({ id: 'admin-1', email: 'admin@b.com', role: 'admin' });
    mockAdminApi();
    let rejectCalled = false;
    server.use(
      http.post('/api/admin/resolution-proposals/proposal-1/reject', () => {
        rejectCalled = true;
        return HttpResponse.json({ ...sampleProposal, status: 'rejected' });
      }),
    );

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByText('Buraco na rua');

    const rejectButtons = screen.getAllByRole('button', { name: 'Rejeitar' });
    await userEvent.click(rejectButtons[rejectButtons.length - 1]);

    await waitFor(() => expect(rejectCalled).toBe(true));
  });
});

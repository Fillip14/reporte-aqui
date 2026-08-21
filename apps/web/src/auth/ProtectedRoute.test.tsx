import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { mockLoggedOut, mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects to /login when logged out', async () => {
    mockLoggedOut();
    renderWithProviders(
      <ProtectedRoute>
        <p>secret content</p>
      </ProtectedRoute>,
      { route: '/profile', path: '/profile' },
    );

    await waitFor(() => expect(screen.queryByText('secret content')).not.toBeInTheDocument());
  });

  it('renders children when logged in', async () => {
    mockLoggedIn({ id: '1', email: 'a@b.com', role: 'individual' });
    renderWithProviders(
      <ProtectedRoute>
        <p>secret content</p>
      </ProtectedRoute>,
      { route: '/profile', path: '/profile' },
    );

    await waitFor(() => expect(screen.getByText('secret content')).toBeInTheDocument());
  });

  it('redirects away when the required role does not match', async () => {
    mockLoggedIn({ id: '1', email: 'a@b.com', role: 'individual' });
    renderWithProviders(
      <ProtectedRoute role="admin">
        <p>admin content</p>
      </ProtectedRoute>,
      { route: '/admin', path: '/admin' },
    );

    await waitFor(() => expect(screen.queryByText('admin content')).not.toBeInTheDocument());
  });

  it('renders children when the required role matches', async () => {
    mockLoggedIn({ id: '1', email: 'a@b.com', role: 'admin' });
    renderWithProviders(
      <ProtectedRoute role="admin">
        <p>admin content</p>
      </ProtectedRoute>,
      { route: '/admin', path: '/admin' },
    );

    await waitFor(() => expect(screen.getByText('admin content')).toBeInTheDocument());
  });
});

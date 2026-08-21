import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { UserRole } from '../api/auth';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p>Carregando...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

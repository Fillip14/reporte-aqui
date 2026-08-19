import { apiFetch } from './client';

export type UserRole = 'individual' | 'company' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

export function registerIndividual(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/register/individual', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuthRetry: true,
  });
}

export function registerCompany(input: {
  email: string;
  password: string;
  companyName: string;
  cnpj: string;
}): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/register/company', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuthRetry: true,
  });
}

export function login(input: { email: string; password: string }): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuthRetry: true,
  });
}

export function refreshSession(): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/refresh', { method: 'POST', skipAuthRetry: true });
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST', skipAuthRetry: true });
}

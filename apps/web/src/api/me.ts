import { apiFetch } from './client';
import type { UserRole } from './auth';

export interface MeProfile {
  id: string;
  email: string;
  role: UserRole;
  individualProfile: { fullName: string } | null;
  companyProfile: {
    companyName: string;
    cnpj: string;
    verificationStatus: 'pending' | 'approved' | 'rejected';
  } | null;
}

export function getMe(): Promise<MeProfile> {
  return apiFetch<MeProfile>('/me');
}

export function updateMeIndividual(input: { fullName: string }): Promise<MeProfile> {
  return apiFetch<MeProfile>('/me', { method: 'PATCH', body: JSON.stringify(input) });
}

export function updateMeCompany(input: { companyName?: string; cnpj?: string }): Promise<MeProfile> {
  return apiFetch<MeProfile>('/me', { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteMe(): Promise<void> {
  return apiFetch<void>('/me', { method: 'DELETE' });
}

import { apiFetch } from './client';

export interface Company {
  id: string;
  companyName: string;
}

export function listCompanies(): Promise<Company[]> {
  return apiFetch<Company[]>('/companies');
}

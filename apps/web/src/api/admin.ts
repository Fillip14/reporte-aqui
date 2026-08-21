import { apiFetch } from './client';

export interface PendingCompany {
  id: string;
  companyName: string;
  cnpj: string;
  user: { email: string };
}

export interface PendingResolutionProposal {
  id: string;
  problemId: string;
  mediaUrl: string;
  problem: { title: string };
}

export function listPendingCompanies(): Promise<PendingCompany[]> {
  return apiFetch<PendingCompany[]>('/admin/companies/pending');
}

export function approveCompany(id: string): Promise<PendingCompany> {
  return apiFetch<PendingCompany>(`/admin/companies/${id}/approve`, { method: 'POST' });
}

export function rejectCompany(id: string, reason: string): Promise<PendingCompany> {
  return apiFetch<PendingCompany>(`/admin/companies/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function listPendingResolutionProposals(): Promise<PendingResolutionProposal[]> {
  return apiFetch<PendingResolutionProposal[]>('/admin/resolution-proposals/pending');
}

export function approveResolutionProposal(id: string): Promise<PendingResolutionProposal> {
  return apiFetch<PendingResolutionProposal>(`/admin/resolution-proposals/${id}/approve`, { method: 'POST' });
}

export function rejectResolutionProposal(id: string): Promise<PendingResolutionProposal> {
  return apiFetch<PendingResolutionProposal>(`/admin/resolution-proposals/${id}/reject`, { method: 'POST' });
}

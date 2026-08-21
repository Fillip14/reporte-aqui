import { apiFetch } from './client';
import type { Company } from './companies';

export type ProblemStatus = 'open' | 'pending_verification' | 'resolved' | 'cancelled';
export type MediaType = 'image' | 'video';

export interface ProblemMedia {
  id: string;
  objectKey: string;
  mediaType: MediaType;
  url: string;
}

export interface ProblemRating {
  id: string;
  score: number;
  comment: string | null;
}

export interface ProblemListItem {
  id: string;
  authorId: string;
  title: string;
  description: string;
  location: string;
  status: ProblemStatus;
  resolvedAt: string | null;
  resolvedById: string | null;
  createdAt: string;
  updatedAt: string;
  media: ProblemMedia[];
  voteCount: number;
  hasVoted: boolean;
  responsibleCompany: Company | null;
}

export interface ProblemDetail extends ProblemListItem {
  rating: ProblemRating | null;
}

export interface ListProblemsParams {
  status?: ProblemStatus;
  q?: string;
  sort?: 'newest' | 'top';
  page?: number;
  limit?: number;
  companyId?: string;
}

export interface ListProblemsResult {
  items: ProblemListItem[];
  page: number;
  limit: number;
  total: number;
}

export function listProblems(params: ListProblemsParams = {}): Promise<ListProblemsResult> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.q) query.set('q', params.q);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.companyId) query.set('companyId', params.companyId);
  const qs = query.toString();
  return apiFetch<ListProblemsResult>(`/problems${qs ? `?${qs}` : ''}`);
}

export function getProblem(id: string): Promise<ProblemDetail> {
  return apiFetch<ProblemDetail>(`/problems/${id}`);
}

export function toggleVote(id: string): Promise<{ voted: boolean }> {
  return apiFetch<{ voted: boolean }>(`/problems/${id}/vote`, { method: 'POST' });
}

export function cancelProblem(id: string): Promise<{ status: ProblemStatus }> {
  return apiFetch<{ status: ProblemStatus }>(`/problems/${id}/cancel`, { method: 'POST' });
}

export function resolveProblem(id: string): Promise<{ status: ProblemStatus }> {
  return apiFetch<{ status: ProblemStatus }>(`/problems/${id}/resolve`, { method: 'POST' });
}

export function createResolutionProposal(id: string, objectKey: string): Promise<{ id: string; status: string }> {
  return apiFetch<{ id: string; status: string }>(`/problems/${id}/resolution-proposals`, {
    method: 'POST',
    body: JSON.stringify({ objectKey }),
  });
}

export function rateResolution(id: string, input: { score: number; comment?: string }): Promise<ProblemRating> {
  return apiFetch<ProblemRating>(`/problems/${id}/rating`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createProblem(input: {
  title: string;
  description: string;
  location: string;
  media: { objectKey: string; mediaType: MediaType }[];
  responsibleCompanyId?: string;
}): Promise<ProblemDetail> {
  return apiFetch<ProblemDetail>('/problems', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

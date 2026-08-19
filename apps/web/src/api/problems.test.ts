import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import {
  listProblems,
  getProblem,
  toggleVote,
  cancelProblem,
  resolveProblem,
  createResolutionProposal,
  rateResolution,
  createProblem,
} from './problems';

const sample = {
  id: 'abc',
  authorId: 'u1',
  title: 'Buraco na rua',
  description: 'd'.repeat(20),
  location: 'Rua X',
  status: 'open',
  resolvedAt: null,
  resolvedById: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  media: [],
  voteCount: 0,
  hasVoted: false,
  rating: null,
};

describe('problems api', () => {
  it('listProblems builds the query string from params', async () => {
    server.use(
      http.get('/api/problems', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('status')).toBe('open');
        expect(url.searchParams.get('q')).toBe('buraco');
        expect(url.searchParams.get('sort')).toBe('top');
        return HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 });
      }),
    );

    const result = await listProblems({ status: 'open', q: 'buraco', sort: 'top' });
    expect(result.total).toBe(0);
  });

  it('listProblems omits unset params', async () => {
    server.use(
      http.get('/api/problems', ({ request }) => {
        const url = new URL(request.url);
        expect(url.search).toBe('');
        return HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 });
      }),
    );

    await listProblems();
  });

  it('getProblem fetches a single problem by id', async () => {
    server.use(http.get('/api/problems/abc', () => HttpResponse.json(sample)));

    const problem = await getProblem('abc');
    expect(problem.title).toBe('Buraco na rua');
  });

  it('toggleVote posts to the vote endpoint', async () => {
    server.use(http.post('/api/problems/abc/vote', () => HttpResponse.json({ voted: true })));
    const result = await toggleVote('abc');
    expect(result.voted).toBe(true);
  });

  it('cancelProblem posts to the cancel endpoint', async () => {
    server.use(http.post('/api/problems/abc/cancel', () => HttpResponse.json({ status: 'cancelled' })));
    const result = await cancelProblem('abc');
    expect(result.status).toBe('cancelled');
  });

  it('resolveProblem posts to the resolve endpoint', async () => {
    server.use(http.post('/api/problems/abc/resolve', () => HttpResponse.json({ status: 'resolved' })));
    const result = await resolveProblem('abc');
    expect(result.status).toBe('resolved');
  });

  it('createResolutionProposal sends the objectKey', async () => {
    server.use(
      http.post('/api/problems/abc/resolution-proposals', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ objectKey: 'u1/photo.jpg' });
        return HttpResponse.json({ id: 'p1', status: 'pending' }, { status: 201 });
      }),
    );

    const result = await createResolutionProposal('abc', 'u1/photo.jpg');
    expect(result.status).toBe('pending');
  });

  it('rateResolution sends score and comment', async () => {
    server.use(
      http.post('/api/problems/abc/rating', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ score: 5, comment: 'Ótimo' });
        return HttpResponse.json({ id: 'r1', score: 5, comment: 'Ótimo' }, { status: 201 });
      }),
    );

    const rating = await rateResolution('abc', { score: 5, comment: 'Ótimo' });
    expect(rating.score).toBe(5);
  });

  it('createProblem posts title, description, location and media', async () => {
    server.use(
      http.post('/api/problems', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({
          title: 'Buraco na rua',
          description: 'd'.repeat(20),
          location: 'Rua X',
          media: [{ objectKey: 'u1/a.jpg', mediaType: 'image' }],
        });
        return HttpResponse.json(sample, { status: 201 });
      }),
    );

    const problem = await createProblem({
      title: 'Buraco na rua',
      description: 'd'.repeat(20),
      location: 'Rua X',
      media: [{ objectKey: 'u1/a.jpg', mediaType: 'image' }],
    });
    expect(problem.id).toBe('abc');
  });
});

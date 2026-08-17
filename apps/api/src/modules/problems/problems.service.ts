import { Prisma } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { CreateProblemInput, ListProblemsQuery } from './problems.validation.js';
import { publicMediaUrl } from '../../lib/r2.js';

export class ProblemNotFoundError extends Error {}
export class NotProblemAuthorError extends Error {}
export class InvalidProblemStateError extends Error {}
export class CannotActOnOwnProblemError extends Error {}
export class PendingProposalExistsError extends Error {}
export class RatingAlreadyExistsError extends Error {}

export async function createProblem(authorId: string, input: CreateProblemInput) {
  return prisma.problem.create({
    data: {
      authorId,
      title: input.title,
      description: input.description,
      location: input.location,
      media: { create: input.media },
    },
    include: { media: true },
  });
}

function withMediaUrls<T extends { media: { objectKey: string }[] }>(problem: T) {
  return {
    ...problem,
    media: problem.media.map((m) => ({ ...m, url: publicMediaUrl(m.objectKey) })),
  };
}

export async function listProblems(query: ListProblemsQuery, viewerId?: string) {
  const where: Prisma.ProblemWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' as const } },
            { description: { contains: query.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      include: { media: true, _count: { select: { votes: true } } },
      orderBy: query.sort === 'top' ? { votes: { _count: 'desc' } } : { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.problem.count({ where }),
  ]);

  const votedProblemIds = await votedIdsFor(viewerId, problems.map((p) => p.id));

  return {
    items: problems.map((p) => ({
      ...withMediaUrls(p),
      voteCount: p._count.votes,
      hasVoted: votedProblemIds.has(p.id),
    })),
    page: query.page,
    limit: query.limit,
    total,
  };
}

export async function getProblemById(problemId: string, viewerId?: string) {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { media: true, rating: true, _count: { select: { votes: true } } },
  });
  if (!problem) throw new ProblemNotFoundError();

  const votedProblemIds = await votedIdsFor(viewerId, [problem.id]);

  return {
    ...withMediaUrls(problem),
    voteCount: problem._count.votes,
    hasVoted: votedProblemIds.has(problem.id),
  };
}

async function votedIdsFor(viewerId: string | undefined, problemIds: string[]): Promise<Set<string>> {
  if (!viewerId || problemIds.length === 0) return new Set();
  const votes = await prisma.problemVote.findMany({
    where: { userId: viewerId, problemId: { in: problemIds } },
    select: { problemId: true },
  });
  return new Set(votes.map((v) => v.problemId));
}

export async function cancelProblem(problemId: string, userId: string) {
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) throw new ProblemNotFoundError();
  if (problem.authorId !== userId) throw new NotProblemAuthorError();
  if (problem.status !== 'open') throw new InvalidProblemStateError();

  return prisma.problem.update({ where: { id: problemId }, data: { status: 'cancelled' } });
}

export async function resolveProblem(problemId: string, actingUserId: string, actingUserRole: UserRole) {
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) throw new ProblemNotFoundError();
  if (problem.authorId !== actingUserId && actingUserRole !== 'admin') throw new NotProblemAuthorError();
  if (problem.status !== 'open') throw new InvalidProblemStateError();

  return prisma.problem.update({
    where: { id: problemId },
    data: { status: 'resolved', resolvedAt: new Date(), resolvedById: actingUserId },
  });
}

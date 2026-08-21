import { Prisma } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { CreateProblemInput, ListProblemsQuery, RateResolutionInput } from './problems.validation.js';
import { publicMediaUrl } from '../../lib/r2.js';

export class ProblemNotFoundError extends Error {}
export class NotProblemAuthorError extends Error {}
export class InvalidProblemStateError extends Error {}
export class CannotActOnOwnProblemError extends Error {}
export class PendingProposalExistsError extends Error {}
export class RatingAlreadyExistsError extends Error {}
export class ForbiddenObjectKeyError extends Error {}
export class CompanyNotFoundError extends Error {}

function assertObjectKeyOwnedBy(objectKey: string, userId: string) {
  if (!objectKey.startsWith(`${userId}/`)) throw new ForbiddenObjectKeyError();
}

export async function createProblem(authorId: string, input: CreateProblemInput) {
  for (const item of input.media) {
    assertObjectKeyOwnedBy(item.objectKey, authorId);
  }

  if (input.responsibleCompanyId) {
    const company = await prisma.companyProfile.findUnique({
      where: { id: input.responsibleCompanyId },
      include: { user: { select: { status: true } } },
    });
    if (!company || company.verificationStatus !== 'approved' || company.user.status !== 'active') {
      throw new CompanyNotFoundError();
    }
  }

  return prisma.problem.create({
    data: {
      authorId,
      title: input.title,
      description: input.description,
      location: input.location,
      responsibleCompanyId: input.responsibleCompanyId,
      media: { create: input.media },
    },
    include: { media: true, responsibleCompany: { select: { id: true, companyName: true } } },
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
    ...(query.companyId ? { responsibleCompanyId: query.companyId } : {}),
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
      include: {
        media: true,
        responsibleCompany: { select: { id: true, companyName: true } },
        _count: { select: { votes: true } },
      },
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
    include: {
      media: true,
      rating: true,
      responsibleCompany: { select: { id: true, companyName: true } },
      _count: { select: { votes: true } },
    },
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

export async function toggleVote(problemId: string, userId: string): Promise<{ voted: boolean }> {
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) throw new ProblemNotFoundError();
  if (problem.authorId === userId) throw new CannotActOnOwnProblemError();
  if (problem.status !== 'open' && problem.status !== 'pending_verification') {
    throw new InvalidProblemStateError();
  }

  const existing = await prisma.problemVote.findUnique({
    where: { problemId_userId: { problemId, userId } },
  });

  if (existing) {
    await prisma.problemVote.delete({ where: { id: existing.id } });
    return { voted: false };
  }

  await prisma.problemVote.create({ data: { problemId, userId } });
  return { voted: true };
}

export async function createResolutionProposal(problemId: string, proposedById: string, objectKey: string) {
  assertObjectKeyOwnedBy(objectKey, proposedById);

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) throw new ProblemNotFoundError();
  if (problem.authorId === proposedById) throw new CannotActOnOwnProblemError();
  if (problem.status !== 'open') throw new InvalidProblemStateError();

  const existingPending = await prisma.resolutionProposal.findFirst({
    where: { problemId, status: 'pending' },
  });
  if (existingPending) throw new PendingProposalExistsError();

  return prisma.$transaction(async (tx) => {
    const proposal = await tx.resolutionProposal.create({
      data: { problemId, proposedById, objectKey },
    });

    const { count } = await tx.problem.updateMany({
      where: { id: problemId, status: 'open' },
      data: { status: 'pending_verification' },
    });
    if (count === 0) throw new InvalidProblemStateError();

    return proposal;
  });
}

export async function rateResolution(
  problemId: string,
  ratedById: string,
  actingUserRole: UserRole,
  input: RateResolutionInput,
) {
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) throw new ProblemNotFoundError();
  if (problem.authorId !== ratedById && actingUserRole !== 'admin') throw new NotProblemAuthorError();
  if (problem.status !== 'resolved') throw new InvalidProblemStateError();

  const existing = await prisma.problemRating.findUnique({ where: { problemId } });
  if (existing) throw new RatingAlreadyExistsError();

  return prisma.problemRating.create({
    data: { problemId, ratedById, score: input.score, comment: input.comment },
  });
}

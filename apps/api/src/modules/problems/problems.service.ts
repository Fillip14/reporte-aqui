import { prisma } from '../../lib/prisma.js';
import type { CreateProblemInput } from './problems.validation.js';

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

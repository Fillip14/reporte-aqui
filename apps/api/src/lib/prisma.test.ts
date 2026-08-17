import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from './prisma.js';
import { resetDb } from '../../tests/helpers/resetDb.js';

describe('prisma client', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('creates and finds a user', async () => {
    const created = await prisma.user.create({
      data: {
        email: 'smoke@example.com',
        passwordHash: 'dummy-hash',
        role: 'individual',
      },
    });

    const found = await prisma.user.findUnique({ where: { id: created.id } });
    expect(found?.email).toBe('smoke@example.com');
  });

  it('creates a problem with media, a vote, a resolution proposal, and a rating', async () => {
    const author = await prisma.user.create({
      data: { email: 'author@example.com', passwordHash: 'dummy-hash', role: 'individual' },
    });
    const voter = await prisma.user.create({
      data: { email: 'voter@example.com', passwordHash: 'dummy-hash', role: 'individual' },
    });
    const admin = await prisma.user.create({
      data: { email: 'admin@example.com', passwordHash: 'dummy-hash', role: 'admin' },
    });

    const problem = await prisma.problem.create({
      data: {
        authorId: author.id,
        title: 'Buraco na rua',
        description: 'Buraco grande e perigoso na Rua das Flores, perto do número 123.',
        location: 'Rua das Flores, 123',
        media: { create: [{ objectKey: `${author.id}/photo.jpg`, mediaType: 'image' }] },
      },
      include: { media: true },
    });
    expect(problem.status).toBe('open');
    expect(problem.media).toHaveLength(1);

    await prisma.problemVote.create({ data: { problemId: problem.id, userId: voter.id } });
    await expect(
      prisma.problemVote.create({ data: { problemId: problem.id, userId: voter.id } }),
    ).rejects.toThrow();

    const proposal = await prisma.resolutionProposal.create({
      data: { problemId: problem.id, proposedById: voter.id, objectKey: `${voter.id}/evidence.jpg` },
    });
    expect(proposal.status).toBe('pending');

    await prisma.problem.update({
      where: { id: problem.id },
      data: { status: 'resolved', resolvedAt: new Date(), resolvedById: admin.id },
    });
    const rating = await prisma.problemRating.create({
      data: { problemId: problem.id, ratedById: author.id, score: 5, comment: 'Resolvido rápido!' },
    });
    expect(rating.score).toBe(5);

    await expect(
      prisma.problemRating.create({ data: { problemId: problem.id, ratedById: admin.id, score: 3 } }),
    ).rejects.toThrow();
  });
});

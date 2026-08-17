import { prisma } from '../../src/lib/prisma.js';

export async function resetDb() {
  await prisma.problemRating.deleteMany();
  await prisma.resolutionProposal.deleteMany();
  await prisma.problemVote.deleteMany();
  await prisma.problemMedia.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.individualProfile.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.user.deleteMany();
}

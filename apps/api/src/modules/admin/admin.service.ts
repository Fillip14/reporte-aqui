import { prisma } from '../../lib/prisma.js';

export class ProposalNotFoundError extends Error {}
export class ProposalAlreadyReviewedError extends Error {}

export async function listPendingCompanies() {
  return prisma.companyProfile.findMany({ where: { verificationStatus: 'pending' } });
}

export async function approveCompany(companyProfileId: string, adminId: string) {
  return prisma.companyProfile.update({
    where: { id: companyProfileId },
    data: {
      verificationStatus: 'approved',
      verifiedAt: new Date(),
      verifiedById: adminId,
      rejectionReason: null,
    },
  });
}

export async function rejectCompany(companyProfileId: string, adminId: string, reason: string) {
  return prisma.companyProfile.update({
    where: { id: companyProfileId },
    data: {
      verificationStatus: 'rejected',
      verifiedAt: new Date(),
      verifiedById: adminId,
      rejectionReason: reason,
    },
  });
}

export async function listPendingResolutionProposals() {
  return prisma.resolutionProposal.findMany({ where: { status: 'pending' }, include: { problem: true } });
}

export async function approveResolutionProposal(proposalId: string, adminId: string) {
  const proposal = await prisma.resolutionProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new ProposalNotFoundError();
  if (proposal.status !== 'pending') throw new ProposalAlreadyReviewedError();

  const [updatedProposal] = await prisma.$transaction([
    prisma.resolutionProposal.update({
      where: { id: proposalId },
      data: { status: 'approved', reviewedById: adminId, reviewedAt: new Date() },
    }),
    prisma.problem.update({
      where: { id: proposal.problemId },
      data: { status: 'resolved', resolvedAt: new Date(), resolvedById: adminId },
    }),
  ]);

  return updatedProposal;
}

export async function rejectResolutionProposal(proposalId: string, adminId: string) {
  const proposal = await prisma.resolutionProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new ProposalNotFoundError();
  if (proposal.status !== 'pending') throw new ProposalAlreadyReviewedError();

  const [updatedProposal] = await prisma.$transaction([
    prisma.resolutionProposal.update({
      where: { id: proposalId },
      data: { status: 'rejected', reviewedById: adminId, reviewedAt: new Date() },
    }),
    prisma.problem.update({
      where: { id: proposal.problemId },
      data: { status: 'open' },
    }),
  ]);

  return updatedProposal;
}

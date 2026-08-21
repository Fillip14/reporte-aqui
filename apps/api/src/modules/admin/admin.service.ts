import { prisma } from '../../lib/prisma.js';
import { publicMediaUrl } from '../../lib/r2.js';

export class ProposalNotFoundError extends Error {}
export class ProposalAlreadyReviewedError extends Error {}
export class ProblemStateChangedError extends Error {}

export async function listPendingCompanies() {
  return prisma.companyProfile.findMany({
    where: { verificationStatus: 'pending' },
    include: { user: { select: { email: true } } },
  });
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
  const proposals = await prisma.resolutionProposal.findMany({
    where: { status: 'pending' },
    include: { problem: true },
  });
  return proposals.map((proposal) => ({ ...proposal, mediaUrl: publicMediaUrl(proposal.objectKey) }));
}

export async function approveResolutionProposal(proposalId: string, adminId: string) {
  const proposal = await prisma.resolutionProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new ProposalNotFoundError();
  if (proposal.status !== 'pending') throw new ProposalAlreadyReviewedError();

  return prisma.$transaction(async (tx) => {
    const updatedProposal = await tx.resolutionProposal.update({
      where: { id: proposalId },
      data: { status: 'approved', reviewedById: adminId, reviewedAt: new Date() },
    });

    const { count } = await tx.problem.updateMany({
      where: { id: proposal.problemId, status: 'pending_verification' },
      data: { status: 'resolved', resolvedAt: new Date(), resolvedById: adminId },
    });
    if (count === 0) throw new ProblemStateChangedError();

    return updatedProposal;
  });
}

export async function rejectResolutionProposal(proposalId: string, adminId: string) {
  const proposal = await prisma.resolutionProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new ProposalNotFoundError();
  if (proposal.status !== 'pending') throw new ProposalAlreadyReviewedError();

  return prisma.$transaction(async (tx) => {
    const updatedProposal = await tx.resolutionProposal.update({
      where: { id: proposalId },
      data: { status: 'rejected', reviewedById: adminId, reviewedAt: new Date() },
    });

    const { count } = await tx.problem.updateMany({
      where: { id: proposal.problemId, status: 'pending_verification' },
      data: { status: 'open' },
    });
    if (count === 0) throw new ProblemStateChangedError();

    return updatedProposal;
  });
}

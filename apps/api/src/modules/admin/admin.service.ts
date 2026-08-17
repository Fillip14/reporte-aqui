import { prisma } from '../../lib/prisma.js';

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

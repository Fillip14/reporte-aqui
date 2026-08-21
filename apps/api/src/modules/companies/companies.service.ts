import { prisma } from '../../lib/prisma.js';

export async function listApprovedCompanies() {
  return prisma.companyProfile.findMany({
    where: { verificationStatus: 'approved', user: { status: 'active' } },
    select: { id: true, companyName: true },
    orderBy: { companyName: 'asc' },
  });
}

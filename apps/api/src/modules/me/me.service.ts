import { prisma } from '../../lib/prisma.js';

export async function getProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { individualProfile: true, companyProfile: true },
  });
}

export async function updateIndividualProfile(userId: string, data: { fullName?: string }) {
  await prisma.individualProfile.update({ where: { userId }, data });
}

export async function updateCompanyProfile(
  userId: string,
  data: { companyName?: string; cnpj?: string },
) {
  const updateData: { companyName?: string; cnpj?: string; verificationStatus?: 'pending' } = {
    ...data,
  };
  if (data.cnpj) {
    updateData.verificationStatus = 'pending';
  }
  await prisma.companyProfile.update({ where: { userId }, data: updateData });
}

export async function deleteAccount(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        status: 'deleted',
        email: `deleted-${userId}@removed.local`,
        passwordHash: '',
      },
    });

    if (user.role === 'individual') {
      await tx.individualProfile.update({
        where: { userId },
        data: { fullName: 'Usuário removido' },
      });
    } else if (user.role === 'company') {
      await tx.companyProfile.update({
        where: { userId },
        data: { companyName: 'Empresa removida' },
      });
    }

    await tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });
}

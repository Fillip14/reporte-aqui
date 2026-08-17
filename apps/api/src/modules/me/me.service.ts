import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { CnpjAlreadyRegisteredError } from '../auth/auth.service.js';

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
  const current = await prisma.companyProfile.findUniqueOrThrow({ where: { userId } });
  const newCnpj = data.cnpj;
  const cnpjChanged = newCnpj !== undefined && newCnpj !== current.cnpj;

  if (cnpjChanged && newCnpj !== undefined) {
    const conflicting = await prisma.companyProfile.findUnique({ where: { cnpj: newCnpj } });
    if (conflicting && conflicting.userId !== userId) {
      throw new CnpjAlreadyRegisteredError();
    }
  }

  const updateData: {
    companyName?: string;
    cnpj?: string;
    verificationStatus?: 'pending';
    verifiedAt?: null;
    verifiedById?: null;
    rejectionReason?: null;
  } = { ...data };

  if (cnpjChanged) {
    updateData.verificationStatus = 'pending';
    updateData.verifiedAt = null;
    updateData.verifiedById = null;
    updateData.rejectionReason = null;
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
        passwordHash: crypto.randomBytes(32).toString('hex'),
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

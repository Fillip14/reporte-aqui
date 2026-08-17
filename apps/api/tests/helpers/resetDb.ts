import { prisma } from '../../src/lib/prisma.js';

export async function resetDb() {
  await prisma.refreshToken.deleteMany();
  await prisma.individualProfile.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.user.deleteMany();
}

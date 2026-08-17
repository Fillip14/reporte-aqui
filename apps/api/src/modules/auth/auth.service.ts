import type { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from '../../lib/tokens.js';
import type { RegisterIndividualInput, RegisterCompanyInput, LoginInput } from './auth.validation.js';

export class EmailAlreadyRegisteredError extends Error {}
export class CnpjAlreadyRegisteredError extends Error {}

export interface AuthResult {
  user: { id: string; email: string; role: UserRole };
  accessToken: string;
  refreshToken: string;
}

export async function registerIndividual(input: RegisterIndividualInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new EmailAlreadyRegisteredError();

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: 'individual',
      individualProfile: { create: { fullName: input.fullName } },
    },
  });

  return issueSession(user.id, user.email, user.role);
}

export async function registerCompany(input: RegisterCompanyInput): Promise<AuthResult> {
  const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingEmail) throw new EmailAlreadyRegisteredError();

  const existingCnpj = await prisma.companyProfile.findUnique({ where: { cnpj: input.cnpj } });
  if (existingCnpj) throw new CnpjAlreadyRegisteredError();

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: 'company',
      companyProfile: { create: { companyName: input.companyName, cnpj: input.cnpj } },
    },
  });

  return issueSession(user.id, user.email, user.role);
}

export async function issueSession(userId: string, email: string, role: UserRole): Promise<AuthResult> {
  const accessToken = signAccessToken({ sub: userId, role });
  const { token: refreshToken, hash } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  return { user: { id: userId, email, role }, accessToken, refreshToken };
}

export class InvalidCredentialsError extends Error {}
export class InvalidRefreshTokenError extends Error {}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.status === 'deleted') throw new InvalidCredentialsError();

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new InvalidCredentialsError();

  return issueSession(user.id, user.email, user.role);
}

export async function refreshSession(refreshToken: string): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new InvalidRefreshTokenError();
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
  return issueSession(user.id, user.email, user.role);
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

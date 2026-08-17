import type { Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import type { AuthenticatedRequest } from '../../middleware/requireAuth.js';
import * as adminService from './admin.service.js';

const rejectSchema = z.object({ reason: z.string().min(1) });

function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

export async function listPendingCompanies(_req: AuthenticatedRequest, res: Response) {
  const companies = await adminService.listPendingCompanies();
  return res.status(200).json(companies);
}

export async function approveCompany(req: AuthenticatedRequest, res: Response) {
  try {
    const company = await adminService.approveCompany(req.params.id, req.user!.id);
    return res.status(200).json(company);
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      return res.status(404).json({ error: 'company_not_found' });
    }
    throw err;
  }
}

export async function rejectCompany(req: AuthenticatedRequest, res: Response) {
  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }
  try {
    const company = await adminService.rejectCompany(req.params.id, req.user!.id, parsed.data.reason);
    return res.status(200).json(company);
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      return res.status(404).json({ error: 'company_not_found' });
    }
    throw err;
  }
}

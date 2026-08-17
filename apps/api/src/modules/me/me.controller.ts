import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../middleware/requireAuth.js';
import * as meService from './me.service.js';

const updateIndividualSchema = z.object({ fullName: z.string().min(1) });
const updateCompanySchema = z.object({
  companyName: z.string().min(1).optional(),
  cnpj: z.string().regex(/^\d{14}$/).optional(),
});

function toPublicProfile(user: Awaited<ReturnType<typeof meService.getProfile>>) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    individualProfile: user.individualProfile
      ? { fullName: user.individualProfile.fullName }
      : null,
    companyProfile: user.companyProfile
      ? {
          companyName: user.companyProfile.companyName,
          cnpj: user.companyProfile.cnpj,
          verificationStatus: user.companyProfile.verificationStatus,
        }
      : null,
  };
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  const user = await meService.getProfile(req.user!.id);
  return res.status(200).json(toPublicProfile(user));
}

export async function updateMe(req: AuthenticatedRequest, res: Response) {
  if (req.user!.role === 'individual') {
    const parsed = updateIndividualSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
    }
    await meService.updateIndividualProfile(req.user!.id, parsed.data);
  } else if (req.user!.role === 'company') {
    const parsed = updateCompanySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
    }
    await meService.updateCompanyProfile(req.user!.id, parsed.data);
  } else {
    return res.status(400).json({ error: 'not_editable' });
  }

  const user = await meService.getProfile(req.user!.id);
  return res.status(200).json(toPublicProfile(user));
}

export async function deleteMe(req: AuthenticatedRequest, res: Response) {
  await meService.deleteAccount(req.user!.id);
  return res.status(204).send();
}

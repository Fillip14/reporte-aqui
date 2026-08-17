import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/requireAuth.js';
import { createProblemSchema } from './problems.validation.js';
import * as problemsService from './problems.service.js';

export async function createProblem(req: AuthenticatedRequest, res: Response) {
  const parsed = createProblemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }

  const problem = await problemsService.createProblem(req.user!.id, parsed.data);
  return res.status(201).json(problem);
}

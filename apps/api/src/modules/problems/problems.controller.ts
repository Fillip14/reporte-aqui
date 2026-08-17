import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/requireAuth.js';
import { createProblemSchema } from './problems.validation.js';
import * as problemsService from './problems.service.js';
import { listProblemsQuerySchema } from './problems.validation.js';
import { ProblemNotFoundError } from './problems.service.js';

export async function createProblem(req: AuthenticatedRequest, res: Response) {
  const parsed = createProblemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }

  const problem = await problemsService.createProblem(req.user!.id, parsed.data);
  return res.status(201).json(problem);
}

export async function listProblems(req: AuthenticatedRequest, res: Response) {
  const parsed = listProblemsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }
  const result = await problemsService.listProblems(parsed.data, req.user?.id);
  return res.status(200).json(result);
}

export async function getProblem(req: AuthenticatedRequest, res: Response) {
  try {
    const problem = await problemsService.getProblemById(req.params.id, req.user?.id);
    return res.status(200).json(problem);
  } catch (err) {
    if (err instanceof ProblemNotFoundError) {
      return res.status(404).json({ error: 'problem_not_found' });
    }
    throw err;
  }
}

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/requireAuth.js';
import { createProblemSchema } from './problems.validation.js';
import * as problemsService from './problems.service.js';
import { listProblemsQuerySchema } from './problems.validation.js';
import { ProblemNotFoundError, NotProblemAuthorError, InvalidProblemStateError } from './problems.service.js';
import { CannotActOnOwnProblemError } from './problems.service.js';

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

export async function cancelProblem(req: AuthenticatedRequest, res: Response) {
  try {
    const problem = await problemsService.cancelProblem(req.params.id, req.user!.id);
    return res.status(200).json(problem);
  } catch (err) {
    if (err instanceof ProblemNotFoundError) return res.status(404).json({ error: 'problem_not_found' });
    if (err instanceof NotProblemAuthorError) return res.status(403).json({ error: 'forbidden' });
    if (err instanceof InvalidProblemStateError) return res.status(409).json({ error: 'invalid_problem_state' });
    throw err;
  }
}

export async function resolveProblem(req: AuthenticatedRequest, res: Response) {
  try {
    const problem = await problemsService.resolveProblem(req.params.id, req.user!.id, req.user!.role);
    return res.status(200).json(problem);
  } catch (err) {
    if (err instanceof ProblemNotFoundError) return res.status(404).json({ error: 'problem_not_found' });
    if (err instanceof NotProblemAuthorError) return res.status(403).json({ error: 'forbidden' });
    if (err instanceof InvalidProblemStateError) return res.status(409).json({ error: 'invalid_problem_state' });
    throw err;
  }
}

export async function toggleVote(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await problemsService.toggleVote(req.params.id, req.user!.id);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof ProblemNotFoundError) return res.status(404).json({ error: 'problem_not_found' });
    if (err instanceof CannotActOnOwnProblemError) return res.status(403).json({ error: 'forbidden' });
    if (err instanceof InvalidProblemStateError) return res.status(409).json({ error: 'invalid_problem_state' });
    throw err;
  }
}

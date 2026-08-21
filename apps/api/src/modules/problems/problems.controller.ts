import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/requireAuth.js';
import { createProblemSchema, rateResolutionSchema } from './problems.validation.js';
import * as problemsService from './problems.service.js';
import { listProblemsQuerySchema, createResolutionProposalSchema } from './problems.validation.js';
import { ProblemNotFoundError, NotProblemAuthorError, InvalidProblemStateError, RatingAlreadyExistsError } from './problems.service.js';
import { CannotActOnOwnProblemError, PendingProposalExistsError, ForbiddenObjectKeyError, CompanyNotFoundError } from './problems.service.js';

export async function createProblem(req: AuthenticatedRequest, res: Response) {
  const parsed = createProblemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }

  try {
    const problem = await problemsService.createProblem(req.user!.id, parsed.data);
    return res.status(201).json(problem);
  } catch (err) {
    if (err instanceof ForbiddenObjectKeyError) return res.status(403).json({ error: 'forbidden_object_key' });
    if (err instanceof CompanyNotFoundError) return res.status(400).json({ error: 'company_not_found' });
    throw err;
  }
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

export async function createResolutionProposal(req: AuthenticatedRequest, res: Response) {
  const parsed = createResolutionProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }
  try {
    const proposal = await problemsService.createResolutionProposal(
      req.params.id,
      req.user!.id,
      parsed.data.objectKey,
    );
    return res.status(201).json(proposal);
  } catch (err) {
    if (err instanceof ProblemNotFoundError) return res.status(404).json({ error: 'problem_not_found' });
    if (err instanceof CannotActOnOwnProblemError) return res.status(403).json({ error: 'forbidden' });
    if (err instanceof InvalidProblemStateError) return res.status(409).json({ error: 'invalid_problem_state' });
    if (err instanceof PendingProposalExistsError) return res.status(409).json({ error: 'pending_proposal_exists' });
    if (err instanceof ForbiddenObjectKeyError) return res.status(403).json({ error: 'forbidden_object_key' });
    throw err;
  }
}

export async function rateResolution(req: AuthenticatedRequest, res: Response) {
  const parsed = rateResolutionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }
  try {
    const rating = await problemsService.rateResolution(req.params.id, req.user!.id, req.user!.role, parsed.data);
    return res.status(201).json(rating);
  } catch (err) {
    if (err instanceof ProblemNotFoundError) return res.status(404).json({ error: 'problem_not_found' });
    if (err instanceof NotProblemAuthorError) return res.status(403).json({ error: 'forbidden' });
    if (err instanceof InvalidProblemStateError) return res.status(409).json({ error: 'invalid_problem_state' });
    if (err instanceof RatingAlreadyExistsError) return res.status(409).json({ error: 'rating_already_exists' });
    throw err;
  }
}

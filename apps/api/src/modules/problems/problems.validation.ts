import { z } from 'zod';

const mediaItemSchema = z.object({
  objectKey: z.string().min(1),
  mediaType: z.enum(['image', 'video']),
});

export const createProblemSchema = z.object({
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(20).max(5000),
  location: z.string().trim().min(5).max(300),
  media: z.array(mediaItemSchema).min(1).max(5),
  responsibleCompanyId: z.string().uuid().optional(),
});
export type CreateProblemInput = z.infer<typeof createProblemSchema>;

export const listProblemsQuerySchema = z.object({
  status: z.enum(['open', 'pending_verification', 'resolved', 'cancelled']).optional(),
  q: z.string().trim().min(1).max(200).optional(),
  sort: z.enum(['newest', 'top']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  companyId: z.string().uuid().optional(),
});
export type ListProblemsQuery = z.infer<typeof listProblemsQuerySchema>;

export const createResolutionProposalSchema = z.object({
  objectKey: z.string().min(1),
});
export type CreateResolutionProposalInput = z.infer<typeof createResolutionProposalSchema>;

export const rateResolutionSchema = z.object({
  score: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});
export type RateResolutionInput = z.infer<typeof rateResolutionSchema>;

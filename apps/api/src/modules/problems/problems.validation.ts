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
});
export type CreateProblemInput = z.infer<typeof createProblemSchema>;

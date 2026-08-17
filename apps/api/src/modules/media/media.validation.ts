import { z } from 'zod';

export const uploadUrlSchema = z.object({
  mediaType: z.enum(['image', 'video']),
});
export type UploadUrlInput = z.infer<typeof uploadUrlSchema>;

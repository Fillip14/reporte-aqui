import { z } from 'zod';

export const signInSchema = z.object({
  provider: z.string(),
  providerUid: z.string(),
  password: z.string().min(6),
});

export type SignIn = z.infer<typeof signInSchema>;

import { z } from 'zod';

export const signInSchema = z.object({
  id: z.string(),
  type: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

export type SignIn = z.infer<typeof signInSchema>;

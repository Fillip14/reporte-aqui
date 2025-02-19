import { z } from 'zod';
import { UserType } from '../constants/auth.constants';

export const signInSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(UserType),
  email: z.string().email(),
  password: z.string().min(6),
});

export type SignIn = z.infer<typeof signInSchema>;

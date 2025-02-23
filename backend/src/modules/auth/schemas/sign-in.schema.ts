import { z } from 'zod';
import { UserType } from '../constants/auth.constants';

export const signInSchema = z
  .object({
    email: z.string().email().optional(),
    document: z.string().optional(),
    password: z.string().min(6),
  })
  .refine((data) => data.email || data.document, {
    message: 'É necessário informar o email ou o documento.',
    path: ['email'],
  });

export type SignIn = z.infer<typeof signInSchema>;

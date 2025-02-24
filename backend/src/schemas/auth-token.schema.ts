import { z } from 'zod';
import { UserType } from '../constants/api.constants';

export const authMiddlewareSchema = z.object({
  id: z.string().min(1),
  type: z.nativeEnum(UserType),
});

export type AuthSchema = z.infer<typeof authMiddlewareSchema>;

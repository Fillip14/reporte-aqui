import { z } from 'zod';
import { UserType } from '../../../constants/api.constants';

export const profileDataSchema = z.object({
  user_id: z.string().min(1),
  type: z.nativeEnum(UserType),
});

export const profileUpdateSchema = z.object({
  email: z.string().email().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  neighborhood: z.string().min(1),
  street: z.string().min(1),
  number: z.string().min(1),
  zipcode: z.string().regex(/^\d{5}-\d{3}$/),
  URLprofileImage: z.string().url().optional().nullable(),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export type ProfileData = z.infer<typeof profileDataSchema>;

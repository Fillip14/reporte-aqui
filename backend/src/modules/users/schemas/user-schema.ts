import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  cpf: z
    .string()
    .length(11)
    .regex(/^\d{11}$/),
  country: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  neighborhood: z.string().min(1),
  street: z.string().min(1),
  number: z.number().min(1),
  zipcode: z.string().regex(/^\d{5}-\d{3}$/),
  password: z.string().min(6),
});

export type User = z.infer<typeof userSchema>;

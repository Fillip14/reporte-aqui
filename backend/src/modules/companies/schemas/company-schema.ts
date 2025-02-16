import { z } from 'zod';

export const companySchema = z.object({
  companyEmail: z.string().email(),
  companyName: z.string().min(1),
  cnpj: z
    .string()
    .length(14)
    .regex(/^\d{14}$/),
  country: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  neighborhood: z.string().min(1),
  street: z.string().min(1),
  number: z.number().min(1),
  zipcode: z.string().regex(/^\d{5}-\d{3}$/),
  password: z.string().min(6),
});

export type Company = z.infer<typeof companySchema>;

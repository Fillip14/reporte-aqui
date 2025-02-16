import { z } from 'zod';

const baseSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  country: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  neighborhood: z.string().min(1),
  street: z.string().min(1),
  number: z.number().min(1),
  zipcode: z.string().regex(/^\d{5}-\d{3}$/),
  password: z.string().min(6),
});

export const clientSchema = baseSchema.extend({
  cpf: z
    .string()
    .length(11)
    .regex(/^\d{11}$/),
  type: z.literal('clients'),
});

export const companySchema = baseSchema.extend({
  cnpj: z
    .string()
    .length(14)
    .regex(/^\d{14}$/),
  type: z.literal('companies'),
});

export type Client = z.infer<typeof clientSchema>;
export type Company = z.infer<typeof companySchema>;

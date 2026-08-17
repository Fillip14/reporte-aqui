import { z } from 'zod';

export const registerIndividualSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
});
export type RegisterIndividualInput = z.infer<typeof registerIndividualSchema>;

export const registerCompanySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ must have 14 digits'),
});
export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;

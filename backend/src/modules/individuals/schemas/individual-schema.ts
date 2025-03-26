import { z } from 'zod';

const companyNames = ['Empresa A', 'Empresa B', 'Empresa C'];

export const reportSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  vinculedCompany: z
    .string()
    .min(1)
    .refine((value) => companyNames.includes(value), {
      message: 'Empresa vinculada inválida',
    }),
});

export type Report = z.infer<typeof reportSchema>;

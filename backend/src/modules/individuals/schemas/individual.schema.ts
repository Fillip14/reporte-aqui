import { z } from 'zod';

const companyNames = ['Empresa A', 'Empresa B', 'Empresa C'];

export const reportSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  company: z
    .string()
    .min(1)
    .refine((value) => companyNames.includes(value), {
      message: 'Empresa vinculada inválida',
    }),
  doc1: z.string().url().optional().nullable(),
  doc2: z.string().url().optional().nullable(),
  doc3: z.string().url().optional().nullable(),
  textDoc1: z.string().optional().nullable(),
  textDoc2: z.string().optional().nullable(),
  textDoc3: z.string().optional().nullable(),
});

export type Report = z.infer<typeof reportSchema>;

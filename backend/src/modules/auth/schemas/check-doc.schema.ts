import { z } from 'zod';

export const checkDocSchema = z
  .object({
    document: z.string(),
  })
  .superRefine((data, ctx) => {
    const docLength = data.document.length;

    if (docLength === 11) {
      if (!/^\d{11}$/.test(data.document)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CPF inválido',
          path: ['document'],
        });
      }
    } else if (docLength === 14) {
      if (!/^\d{14}$/.test(data.document)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CNPJ inválido',
          path: ['document'],
        });
      }
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Documento inválido',
        path: ['document'],
      });
    }
  });

export type CheckDoc = z.infer<typeof checkDocSchema>;

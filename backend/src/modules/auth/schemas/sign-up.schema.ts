import { z } from 'zod';
import { UserType } from '../../../constants/api.constants';

export const signUpSchema = z
  .object({
    type: z.nativeEnum(UserType),
    email: z.string().email(),
    name: z.string().min(1),
    country: z.string().min(1),
    state: z.string().min(1),
    city: z.string().min(1),
    neighborhood: z.string().min(1),
    street: z.string().min(1),
    number: z.string().min(1),
    zipcode: z.string().regex(/^\d{5}-\d{3}$/),
    document: z.string(),
    password: z.string(),
    // .min(8, 'A senha deve ter no mínimo 8 caracteres')
    // .regex(/[A-Z]/, 'A senha deve ter pelo menos uma letra maiúscula')
    // .regex(/[a-z]/, 'A senha deve ter pelo menos uma letra minúscula')
    // .regex(/[\W_]/, 'A senha deve ter pelo menos um caractere especial')
    // .regex(/\d/, 'A senha deve ter pelo menos um número'),
    // [\W_] pega caracteres não alfanuméricos
  })
  .superRefine((data, ctx) => {
    if (data.type == UserType.INDIVIDUAL) {
      if (!data.document.match(/^\d{11}$/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CPF inválido',
        });
        return false;
      }
    }
    if (data.type == UserType.COMPANY) {
      if (!data.document.match(/^\d{14}$/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CNPJ inválido',
        });
        return false;
      }
    }
  });

export type SignUp = z.infer<typeof signUpSchema>;

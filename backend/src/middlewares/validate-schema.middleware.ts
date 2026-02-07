import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { HttpStatus } from '../constants/api.constants';

export const validate = <T extends ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new AppError('Dados inválidos', HttpStatus.BAD_REQUEST, {
        errors: result.error.flatten().fieldErrors,
      });
    }

    res.locals.validated = result.data;

    next();
  };
};

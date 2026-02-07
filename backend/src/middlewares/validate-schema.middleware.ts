import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { HttpStatus } from '../constants/api.constants';

type DataSource = (req: Request, res: Response) => any;

export const validate = <T extends ZodSchema>(
  schema: T,
  dataSource: DataSource = (req, _res) => req.body, // default: req.body
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = dataSource(req, res);
    const result = schema.safeParse(data);

    if (!result.success) {
      throw new AppError('Dados inválidos', HttpStatus.BAD_REQUEST, {
        errors: result.error.flatten().fieldErrors,
      });
    }

    res.locals.validated = result.data;

    next();
  };
};

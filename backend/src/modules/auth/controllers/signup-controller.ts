import { HttpStatus } from '../../../constants/api.constants';
import { companySchema, clientSchema } from '../schemas/signup-schema';
import { signUpService } from '../services/singup-service';
import express, { Request, Response } from 'express';

export const registerController = async (req: Request, res: Response) => {
  try {
    const userData = req.body.cpf
      ? clientSchema.safeParse(req.body)
      : companySchema.safeParse(req.body);

    if (!userData.success) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: userData.error });
      return;
    }

    const registedName = await signUpService.register(userData.data);

    res.status(HttpStatus.CREATED).json({ registedName });
  } catch (error: any) {
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

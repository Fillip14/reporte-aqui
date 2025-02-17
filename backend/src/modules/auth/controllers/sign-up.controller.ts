import { HttpStatus } from '../../../constants/api.constants';
import { signUpSchema } from '../schemas/sign-up.schema';
import { signUpService } from '../services/sing-up.service';
import express, { Request, Response } from 'express';

export const registerController = async (req: Request, res: Response) => {
  try {
    const userData = signUpSchema.safeParse(req.body);

    if (!userData.success) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: userData.error });
      return;
    }

    const userRegistered = await signUpService.register(userData.data);

    res.status(HttpStatus.CREATED).json({ userRegistered });
  } catch (error: any) {
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

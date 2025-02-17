import { HttpStatus } from '../../../constants/api.constants';
import { signInSchema } from '../schemas/sign-in.schema';
import { signInService } from '../services/sign-in.service';
import express, { Request, Response } from 'express';

export const loginController = async (req: Request, res: Response) => {
  try {
    const userData = signInSchema.safeParse(req.body);

    if (!userData.success) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: userData.error });
      return;
    }

    const userRegistered = await signInService.login(userData.data);

    res.status(HttpStatus.OK).json({ userRegistered });
  } catch (error: any) {
    res.status(HttpStatus.UNAUTHORIZED).json({ error: error.message });
  }
};

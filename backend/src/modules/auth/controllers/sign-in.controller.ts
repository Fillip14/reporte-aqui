import { HttpStatus } from '../../../constants/api.constants';
import { signInSchema } from '../schemas/sign-in.schema';
import { signInService } from '../services/sign-in.service';
import express, { Request, Response } from 'express';
import { EXPIRE_TOKEN } from '../../../constants/api.constants';

export const loginController = async (req: Request, res: Response) => {
  try {
    const userData = signInSchema.safeParse(req.body);

    if (!userData.success) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: userData.error });
      return;
    }

    const authToken = await signInService.login(userData.data);

    res.cookie('auth', authToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: EXPIRE_TOKEN,
    });
    res.status(HttpStatus.OK).json({ message: 'Login realizado com sucesso.' });
  } catch (error: any) {
    res.status(HttpStatus.UNAUTHORIZED).json({ error: error.message });
  }
};

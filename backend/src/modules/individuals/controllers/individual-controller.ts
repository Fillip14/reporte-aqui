import { HttpStatus } from '../../../constants/api.constants';
import { userService } from '../services/individual-service';
import express, { Request, Response } from 'express';
import { userSchema } from '../schemas/individual-schema';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const userData = userSchema.safeParse(req.body);

    if (!userData.success) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: userData.error });
      return;
    }

    const user = await userService.register(userData.data);
    res.status(HttpStatus.CREATED).json({ user });
  } catch (error: any) {
    res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

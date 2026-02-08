import { HttpStatus } from '../../../constants/api.constants';
import { registerUserService } from '../services/sing-up.service';
import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';

export const registerController = asyncHandler(async (req: Request, res: Response) => {
  const userDataValidated = res.locals.validated;

  const userRegistered = await registerUserService(userDataValidated);

  return res.status(HttpStatus.CREATED).json({
    success: true,
    userID: userRegistered,
  });
});

import { HttpStatus } from '../../../constants/api.constants';
import { registerUserService } from '../services/sing-up.service';
import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';

export const registerController = asyncHandler(async (req: Request, res: Response) => {
  const userDataValidated = res.locals.validated;

  const result = await registerUserService(userDataValidated);

  if (result.type === 'EXISTS') {
    return res.status(HttpStatus.OK).json({
      exists: true,
      status: result.status,
      suggestedAction: result.suggestedAction,
    });
  }

  return res.status(HttpStatus.CREATED).json({
    success: true,
    userID: result.userID,
  });
});

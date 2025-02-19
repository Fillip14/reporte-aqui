import express, { Request, Response } from 'express';

export const clearCookieAuth = (req: Request, res: Response) => {
  if (req.cookies.auth) {
    res.clearCookie('auth', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return true;
  }
  return false;
};

import express, { Request, Response, NextFunction } from 'express';

export const logTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log('Time:', Date.now());
  next();
};

export const errorsMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(500).send('Something went wrong!');
};

export const notFoundMiddleware = (req: Request, res: Response) => {
    res.status(404).send('Página não encontrada!');
};
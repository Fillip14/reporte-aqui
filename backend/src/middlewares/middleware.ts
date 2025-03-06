import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { HttpStatus } from '../constants/api.constants';
import logger from '../utils/log/logger';

export const authMiddleware = (requiredType?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.auth;

    if (!token) {
      logger.error(`Token inválido. Token: ${token}`);
      res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Não autorizado.' });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

      if (
        (typeof requiredType === 'string' &&
          decoded.type.toUpperCase() !== requiredType.toUpperCase()) ||
        !['COMPANY', 'INDIVIDUAL'].includes(decoded.type.toUpperCase())
      ) {
        logger.error(
          `Token inválido. Token: ${JSON.stringify(decoded)}. Required: ${requiredType}`
        );
        res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Não autorizado.' });
        return;
      }
      res.locals.user = { uuid: decoded.uuid, type: decoded.type };
      next();
    } catch (error) {
      logger.error(`Token inválido. Token: ${token}`);
      res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Não autorizado.' });
      return;
    }
  };
};

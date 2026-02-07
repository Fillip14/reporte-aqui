import { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { HttpStatus } from '../constants/api.constants';
import logger from '../utils/log/logger';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  // Log geral de todos os erros
  if (err instanceof AppError) {
    logger.log(err.statusCode >= 500 ? 'error' : 'warn', err.message, {
      stack: err.stack,
      details: err.details,
    });

    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details }),
    });
  } else {
    // Qualquer outro erro não tratado
    logger.error('Erro interno não tratado:', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      details: (err as any).details || undefined,
    });

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'Erro interno do servidor',
    });
  }
};

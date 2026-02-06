import logger from '../utils/log/logger';
import { HttpStatus } from '../constants/api.constants';
import { Response } from 'express';

export const sendRes = (res: Response, httpStatus: HttpStatus, payload: any, log?: any) => {
  const logData = log ?? payload;

  if (httpStatus >= 400) {
    logger.error(JSON.stringify({ status: httpStatus, payload: logData }));
    res.status(httpStatus).json({
      success: false,
      error: payload,
    });
  } else {
    logger.info(JSON.stringify({ status: httpStatus, payload: logData }));
    res.status(httpStatus).json({
      success: true,
      data: payload,
    });
  }
};

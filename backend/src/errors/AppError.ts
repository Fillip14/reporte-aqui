import { HttpStatus } from '../constants/api.constants';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = HttpStatus.BAD_REQUEST, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

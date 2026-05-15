import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app.error';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Đã xảy ra lỗi không mong muốn',
  });
};

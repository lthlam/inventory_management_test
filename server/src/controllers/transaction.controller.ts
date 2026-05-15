import { Request, Response, NextFunction } from 'express';
import * as transactionService from '../services/transaction.service';

export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const transactions = await transactionService.getTransactions();
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

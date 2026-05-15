import { Request, Response, NextFunction } from 'express';
import * as receiptService from '../services/receipt.service';
import { NotFoundError } from '../utils/app.error';

export const createReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = await receiptService.createReceipt(req.body);
    res.status(201).json({ id, message: 'Tạo phiếu nhập thành công' });
  } catch (error) {
    next(error);
  }
};

export const getReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;
    const receipt = await receiptService.getReceiptById(id);

    if (!receipt) {
      throw new NotFoundError('phiếu nhập');
    }

    res.status(200).json(receipt);
  } catch (error) {
    next(error);
  }
};

export const listReceipts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const receipts = await receiptService.listReceipts();
    res.status(200).json(receipts);
  } catch (error) {
    next(error);
  }
};

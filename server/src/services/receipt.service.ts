import {
  CreateStockReceiptDetailInput,
  StockReceiptRepository
} from '../repositories/stock.receipt.repository';
import { getDatabaseErrorCode } from '../utils/db.error';
import { AppError } from '../utils/app.error';

interface CreateStockReceiptInput {
  receiptNumber: string;
  receiptDate: string;
  departmentId: string;
  invoiceDocument: string;
  invoiceDate: string;
  debitAccount: string;
  creditAccount: string;
  supplierId: string;
  delivererId: string;
  warehouseId: string;
  details: CreateStockReceiptDetailInput[];
}

export const createReceipt = async (data: CreateStockReceiptInput): Promise<string> => {
  try {
    if (data.details.length === 0) {
      throw new AppError(400, 'Cần ít nhất một dòng chi tiết', 'EMPTY_RECEIPT_DETAILS');
    }

    return await StockReceiptRepository.createWithDetails(data);
  } catch (error: unknown) {
    if (getDatabaseErrorCode(error) === '23505') {
      throw new AppError(409, 'Số phiếu nhập đã tồn tại', 'CONFLICT');
    }

    throw error;
  }
};

export const getReceiptById = async (id: string) => {
  return StockReceiptRepository.findById(id);
};

export const listReceipts = async () => {
  return StockReceiptRepository.findAll();
};

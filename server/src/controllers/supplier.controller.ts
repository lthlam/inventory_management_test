import { Request, Response, NextFunction } from 'express';
import { SupplierService } from '../services/supplier.service';

export const getAllSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const suppliers = await SupplierService.getAllSuppliers();
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await SupplierService.createSupplier(req.body);
    res.status(201).json({ message: 'Thao tác nhà cung cấp thành công', supplier });
  } catch (error) {
    next(error);
  }
};

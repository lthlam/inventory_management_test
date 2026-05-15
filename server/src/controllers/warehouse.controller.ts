import { Request, Response, NextFunction } from 'express';
import { WarehouseService } from '../services/warehouse.service';

export const getAllWarehouses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouses = await WarehouseService.getAllWarehouses();
    res.json(warehouses);
  } catch (error) {
    next(error);
  }
};

export const createWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouse = await WarehouseService.createWarehouse(req.body);
    res.status(201).json({ message: 'Thao tác kho thành công', warehouse });
  } catch (error) {
    next(error);
  }
};

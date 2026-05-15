import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export const getAllInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const inventory = await InventoryService.getAllInventory();
    res.json(inventory);
  } catch (error) {
    next(error);
  }
};

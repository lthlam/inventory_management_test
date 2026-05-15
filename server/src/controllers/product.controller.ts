import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';

export const getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await ProductService.getAllProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

import { NextFunction, Request, Response } from 'express';
import { DelivererService } from '../services/deliverer.service';

export const getAllDeliverers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deliverers = await DelivererService.getAllDeliverers();
    res.json(deliverers);
  } catch (error) {
    next(error);
  }
};

export const createDeliverer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deliverer = await DelivererService.createDeliverer(req.body);
    res.status(201).json({ message: 'Thao tác người giao thành công', deliverer });
  } catch (error) {
    next(error);
  }
};

import { NextFunction, Request, Response } from 'express';
import { OrganizationService } from '../services/organization.service';

export const getAllDivisions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const divisions = await OrganizationService.getAllDivisions();
    res.json(divisions);
  } catch (error) {
    next(error);
  }
};

export const getAllDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const divisionId = typeof req.query.divisionId === 'string' ? req.query.divisionId : undefined;
    const departments = await OrganizationService.getAllDepartments(divisionId);
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

export const createDivision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const division = await OrganizationService.createDivision(req.body);
    res.status(201).json({ message: 'Thao tác đơn vị thành công', division });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const department = await OrganizationService.createDepartment(req.body);
    res.status(201).json({ message: 'Thao tác bộ phận thành công', department });
  } catch (error) {
    next(error);
  }
};

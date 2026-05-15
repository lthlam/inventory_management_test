import { Router } from 'express';
import { validateRequest } from '../middleware/validate.request';
import * as controller from '../controllers/organization.controller';
import {
  createDepartmentSchema,
  getDepartmentsSchema
} from '../validators/organization.validator';

const router = Router();

router.get('/', validateRequest(getDepartmentsSchema), controller.getAllDepartments);
router.post('/', validateRequest(createDepartmentSchema), controller.createDepartment);

export default router;

import { Router } from 'express';
import { validateRequest } from '../middleware/validate.request';
import { createSupplierSchema } from '../validators/supplier.validator';
import { emptyRequestSchema } from '../validators/common.validator';
import * as controller from '../controllers/supplier.controller';

const router = Router();

router.get('/', validateRequest(emptyRequestSchema), controller.getAllSuppliers);
router.post('/', validateRequest(createSupplierSchema), controller.createSupplier);

export default router;

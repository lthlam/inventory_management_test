import { Router } from 'express';
import { validateRequest } from '../middleware/validate.request';
import { createWarehouseSchema } from '../validators/warehouse.validator';
import { emptyRequestSchema } from '../validators/common.validator';
import * as controller from '../controllers/warehouse.controller';

const router = Router();

router.get('/', validateRequest(emptyRequestSchema), controller.getAllWarehouses);
router.post('/', validateRequest(createWarehouseSchema), controller.createWarehouse);

export default router;

import { Router } from 'express';
import { validateRequest } from '../middleware/validate.request';
import * as controller from '../controllers/inventory.controller';
import { emptyRequestSchema } from '../validators/common.validator';

const router = Router();

router.get('/', validateRequest(emptyRequestSchema), controller.getAllInventory);

export default router;

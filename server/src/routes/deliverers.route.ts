import { Router } from 'express';
import { validateRequest } from '../middleware/validate.request';
import * as controller from '../controllers/deliverer.controller';
import { emptyRequestSchema } from '../validators/common.validator';
import { createDelivererSchema } from '../validators/deliverer.validator';

const router = Router();

router.get('/', validateRequest(emptyRequestSchema), controller.getAllDeliverers);
router.post('/', validateRequest(createDelivererSchema), controller.createDeliverer);

export default router;

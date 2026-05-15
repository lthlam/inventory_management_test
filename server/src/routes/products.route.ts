import { Router } from 'express';
import { validateRequest } from '../middleware/validate.request';
import * as controller from '../controllers/product.controller';
import { emptyRequestSchema } from '../validators/common.validator';

const router = Router();

router.get('/', validateRequest(emptyRequestSchema), controller.getAllProducts);

export default router;

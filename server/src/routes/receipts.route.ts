import { Router } from 'express';
import { validateRequest } from '../middleware/validate.request';
import { emptyRequestSchema } from '../validators/common.validator';
import { createReceiptSchema, getReceiptSchema } from '../validators/receipt.validator';
import * as controller from '../controllers/receipt.controller';

const router = Router();

router.get('/', validateRequest(emptyRequestSchema), controller.listReceipts);
router.get('/:id', validateRequest(getReceiptSchema), controller.getReceipt);
router.post('/', validateRequest(createReceiptSchema), controller.createReceipt);

export default router;

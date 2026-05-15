import { Router } from 'express';
import { validateRequest } from '../middleware/validate.request';
import { getTransactions } from '../controllers/transaction.controller';
import { emptyRequestSchema } from '../validators/common.validator';

const router = Router();

router.get('/', validateRequest(emptyRequestSchema), getTransactions);

export default router;

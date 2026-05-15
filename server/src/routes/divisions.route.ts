import { Router } from 'express';
import { validateRequest } from '../middleware/validate.request';
import * as controller from '../controllers/organization.controller';
import { emptyRequestSchema } from '../validators/common.validator';
import { createDivisionSchema } from '../validators/organization.validator';

const router = Router();

router.get('/', validateRequest(emptyRequestSchema), controller.getAllDivisions);
router.post('/', validateRequest(createDivisionSchema), controller.createDivision);

export default router;

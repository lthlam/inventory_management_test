import { Router } from 'express';
import receipts from './receipts.route';
import products from './products.route';
import warehouses from './warehouses.route';
import suppliers from './suppliers.route';
import deliverers from './deliverers.route';
import divisions from './divisions.route';
import departments from './departments.route';
import inventory from './inventory.route';
import transactions from './transactions.route';

const router = Router();

router.use('/products', products);
router.use('/warehouses', warehouses);
router.use('/suppliers', suppliers);
router.use('/deliverers', deliverers);
router.use('/divisions', divisions);
router.use('/departments', departments);
router.use('/inventory', inventory);
router.use('/receipts', receipts);
router.use('/transactions', transactions);

export default router;

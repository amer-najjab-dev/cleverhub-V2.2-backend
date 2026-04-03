// src/routes/supplier.routes.ts
import { Router } from 'express';
import { supplierController } from '../controllers/supplier.controller';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(requireAuth);

router.get('/', supplierController.getAll.bind(supplierController));
router.get('/search', supplierController.search.bind(supplierController));
router.get('/:id', supplierController.getById.bind(supplierController));
router.post('/', requireRole(['admin']), supplierController.create.bind(supplierController));
router.put('/:id', requireRole(['admin']), supplierController.update.bind(supplierController));
router.delete('/:id', requireRole(['admin']), supplierController.delete.bind(supplierController));

export default router;
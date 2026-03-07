import { Router } from 'express';
import { supplierController } from '../controllers/supplier.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// ========== CRUD PROVEEDORES ==========
router.get('/', supplierController.getAll.bind(supplierController));
router.get('/search', supplierController.search.bind(supplierController));
router.get('/:id', supplierController.getById.bind(supplierController));
router.post('/', requireRole(['admin']), 
supplierController.create.bind(supplierController));
router.put('/:id', requireRole(['admin']), 
supplierController.update.bind(supplierController));
router.delete('/:id', requireRole(['admin']), 
supplierController.delete.bind(supplierController));

export default router;

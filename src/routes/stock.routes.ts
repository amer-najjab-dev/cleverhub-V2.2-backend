// src/routes/stock.routes.ts
import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import { stockController } from '../controllers/stock.controller';

const router = Router();

// Todas las rutas requieren rol ADMIN
router.get('/', requireRole(['ADMIN']), stockController.getAll);
router.get('/low-stock', requireRole(['ADMIN']), stockController.getLowStock);
router.get('/expiring', requireRole(['ADMIN']), stockController.getExpiringProducts);
router.get('/movements', requireRole(['ADMIN']), stockController.getMovements);
router.post('/movements', requireRole(['ADMIN']), stockController.createMovement);
router.get('/product/:productId', requireRole(['ADMIN']), stockController.getByProduct);
router.put('/adjust/:id', requireRole(['ADMIN']), stockController.adjustStock);

export default router;
import { Router } from 'express';
import { stockController } from '../controllers/stock.controller';

const router = Router();

router.get('/', stockController.getAll);
router.get('/low-stock', stockController.getLowStock);
router.get('/expiring', stockController.getExpiringProducts);
router.post('/movements', stockController.createMovement);
router.get('/movements', stockController.getMovements);
router.put('/adjust/:id', stockController.adjustStock);
router.get('/product/:productId', stockController.getByProduct);

export default router;

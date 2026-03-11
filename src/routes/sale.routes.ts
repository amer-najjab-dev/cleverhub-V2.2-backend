import { Router } from 'express';
import { saleController } from '../controllers/sale.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', saleController.crear.bind(saleController));
router.get('/', saleController.listar.bind(saleController));
router.get('/:id', saleController.obtenerPorId.bind(saleController));

export default router;

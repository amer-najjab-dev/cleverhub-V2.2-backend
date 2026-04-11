import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.post('/deliveries', requireRole(['ADMIN']), deliveryController.registerDelivery);
router.post('/obligations/payments', requireRole(['ADMIN']), 
deliveryController.registerObligationPayment);
router.get('/suppliers/:supplierId/obligations', requireRole(['ADMIN']), 
deliveryController.getSupplierObligations);

export default router;

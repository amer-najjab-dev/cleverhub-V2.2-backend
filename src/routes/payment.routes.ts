import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Procesar pago - usando el nombre exacto del método
router.post('/clients/:clientId/payments', paymentController.procesarPago.bind(paymentController));

export default router;
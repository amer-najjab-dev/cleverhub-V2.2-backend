import { Router } from 'express';
import { loyaltyCheckoutController } from '../controllers/loyaltyCheckout.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Obtener recompensas disponibles para un cliente
router.get('/available/:clientId', loyaltyCheckoutController.getAvailableRewards.bind(loyaltyCheckoutController));

// Canjear múltiples items
router.post('/redeem/:clientId', loyaltyCheckoutController.redeemItems.bind(loyaltyCheckoutController));

export default router;
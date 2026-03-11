import { Router } from 'express';
import { loyaltyCheckoutController } from '../controllers/loyaltyCheckout.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Rutas para checkout de loyalty
router.get('/client/:clientId/rewards', (req, res) => loyaltyCheckoutController.getAvailableRewards(req, res));
router.get('/client/:clientId/packs', (req, res) => loyaltyCheckoutController.getAvailablePacks(req, res));
router.get('/client/:clientId/rewards/:rewardId/validate', (req, res) => loyaltyCheckoutController.validateRewardRedemption(req, res));
router.get('/client/:clientId/packs/:packId/validate', (req, res) => loyaltyCheckoutController.validatePackRedemption(req, res));
router.get('/client/:clientId/redemptions', (req, res) => loyaltyCheckoutController.getClientRedemptions(req, res));

export default router;

import { Router } from 'express';
import { loyaltyRewardController } from '../controllers/loyaltyReward.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Catálogo de recompensas
router.get('/rewards', loyaltyRewardController.getAllRewards.bind(loyaltyRewardController));
router.post('/rewards', loyaltyRewardController.createReward.bind(loyaltyRewardController));
router.put('/rewards/:id', loyaltyRewardController.updateReward.bind(loyaltyRewardController));
router.delete('/rewards/:id', loyaltyRewardController.deleteReward.bind(loyaltyRewardController));

// Packs
router.get('/packs', loyaltyRewardController.getAllPacks.bind(loyaltyRewardController));
router.post('/packs', loyaltyRewardController.createPack.bind(loyaltyRewardController));

// Canjes
router.post('/redeem/reward/:clientId/:rewardId', loyaltyRewardController.redeemReward.bind(loyaltyRewardController));
router.post('/redeem/pack/:clientId/:packId', loyaltyRewardController.redeemPack.bind(loyaltyRewardController));

// Reportes
router.get('/closure', loyaltyRewardController.getLoyaltyClosure.bind(loyaltyRewardController));

// IA Strategist
router.get('/suggestions', loyaltyRewardController.getPromotionSuggestions.bind(loyaltyRewardController));
router.get('/weekly-strategy', loyaltyRewardController.getWeeklyStrategy.bind(loyaltyRewardController));

export default router;
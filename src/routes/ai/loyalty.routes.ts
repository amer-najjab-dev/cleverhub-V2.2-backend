import { Router } from 'express';
import { loyaltyController } from '../../controllers/ai/loyalty.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/summary', loyaltyController.getLoyaltySummary.bind(loyaltyController));
router.get('/points/circulation', loyaltyController.getPointsInCirculation.bind(loyaltyController));
router.get('/points/client/:clientId', loyaltyController.getClientLoyalty.bind(loyaltyController));
router.get('/chronic-patients', loyaltyController.getChronicPatients.bind(loyaltyController));
router.get('/dormant-clients', loyaltyController.getDormantClients.bind(loyaltyController));
router.get('/tiers', loyaltyController.getTierAnalysis.bind(loyaltyController));
router.get('/categories/:tier', loyaltyController.getFavoriteCategoriesByTier.bind(loyaltyController));

export default router;

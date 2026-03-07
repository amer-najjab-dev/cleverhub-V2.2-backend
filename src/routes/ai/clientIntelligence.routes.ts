import { Router } from 'express';
import { clientIntelligenceController } from '../../controllers/ai/clientIntelligence.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/intelligence', clientIntelligenceController.getClientIntelligence.bind(clientIntelligenceController));
router.get('/risk-scores', clientIntelligenceController.getAllRiskScores.bind(clientIntelligenceController));
router.get('/risk-scores/:clientId', clientIntelligenceController.getClientRiskScore.bind(clientIntelligenceController));
router.get('/segments', clientIntelligenceController.getClientSegments.bind(clientIntelligenceController));
router.get('/behavior/:clientId', clientIntelligenceController.getClientPurchaseBehavior.bind(clientIntelligenceController));

export default router;
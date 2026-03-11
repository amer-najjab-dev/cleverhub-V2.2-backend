import { Router } from 'express';
import { loyaltyConfigController } from '../controllers/loyaltyConfig.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Rutas de configuración de puntos
router.get('/', loyaltyConfigController.getConfig.bind(loyaltyConfigController));
router.put('/', loyaltyConfigController.updateConfig.bind(loyaltyConfigController));
router.get('/statistics', loyaltyConfigController.getStatistics.bind(loyaltyConfigController));
router.get('/simulate', loyaltyConfigController.simulatePoints.bind(loyaltyConfigController));
router.post('/reset', loyaltyConfigController.resetToDefault.bind(loyaltyConfigController));

export default router;
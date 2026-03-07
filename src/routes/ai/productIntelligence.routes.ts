import { Router } from 'express';
import { productIntelligenceController } from '../../controllers/ai/productIntelligence.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(requireAuth);

// Ruta de test para verificar que el router funciona
router.get('/test', productIntelligenceController.test.bind(productIntelligenceController));

// Rutas principales de inteligencia de productos
router.get('/predictions', productIntelligenceController.getPredictions.bind(productIntelligenceController));
router.get('/predictions/:productId', productIntelligenceController.getProductPrediction.bind(productIntelligenceController));
router.get('/trends', productIntelligenceController.getEmergingTrends.bind(productIntelligenceController));
router.get('/market-intelligence', productIntelligenceController.getMarketIntelligence.bind(productIntelligenceController));
router.get('/high-risk-categories', productIntelligenceController.getHighRiskCategories.bind(productIntelligenceController));

console.log('✅ Rutas de IA cargadas: /api/ai/products/*');

export default router;
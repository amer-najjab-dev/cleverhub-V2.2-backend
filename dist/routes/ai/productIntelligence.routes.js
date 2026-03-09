"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productIntelligence_controller_1 = require("../../controllers/ai/productIntelligence.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Middleware de autenticación para todas las rutas
router.use(auth_1.requireAuth);
// Ruta de test para verificar que el router funciona
router.get('/test', productIntelligence_controller_1.productIntelligenceController.test.bind(productIntelligence_controller_1.productIntelligenceController));
// Rutas principales de inteligencia de productos
router.get('/predictions', productIntelligence_controller_1.productIntelligenceController.getPredictions.bind(productIntelligence_controller_1.productIntelligenceController));
router.get('/predictions/:productId', productIntelligence_controller_1.productIntelligenceController.getProductPrediction.bind(productIntelligence_controller_1.productIntelligenceController));
router.get('/trends', productIntelligence_controller_1.productIntelligenceController.getEmergingTrends.bind(productIntelligence_controller_1.productIntelligenceController));
router.get('/market-intelligence', productIntelligence_controller_1.productIntelligenceController.getMarketIntelligence.bind(productIntelligence_controller_1.productIntelligenceController));
router.get('/high-risk-categories', productIntelligence_controller_1.productIntelligenceController.getHighRiskCategories.bind(productIntelligence_controller_1.productIntelligenceController));
console.log('✅ Rutas de IA cargadas: /api/ai/products/*');
exports.default = router;

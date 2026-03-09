"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productIntelligenceController = exports.ProductIntelligenceController = void 0;
const hybridPredictor_service_1 = require("../../services/ai/hybridPredictor.service");
const trendDetection_service_1 = require("../../services/ai/trendDetection.service");
const seasonalMapping_service_1 = require("../../services/ai/seasonalMapping.service");
class ProductIntelligenceController {
    // ========== MÉTODO DE TEST ==========
    async test(req, res) {
        console.log('🔵 Ruta de test llamada');
        res.json({
            success: true,
            data: {
                message: '✅ Ruta de IA funcionando correctamente',
                timestamp: new Date().toISOString()
            }
        });
    }
    // Obtener predicciones para productos top
    async getPredictions(req, res) {
        console.log('🔵 getPredictions llamado con query:', req.query);
        try {
            const { limit } = req.query;
            const predictions = await hybridPredictor_service_1.hybridPredictorService.predictForTopProducts(limit ? parseInt(limit) : 20);
            console.log(`🟢 getPredictions: ${predictions.length} predicciones generadas`);
            res.json({
                success: true,
                data: predictions
            });
        }
        catch (error) {
            console.error('🔴 Error en getPredictions:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    // Obtener predicción para un producto específico
    async getProductPrediction(req, res) {
        console.log(`🔵 getProductPrediction llamado para productId: ${req.params.productId}`);
        try {
            const { productId } = req.params;
            const prediction = await hybridPredictor_service_1.hybridPredictorService.predictForProduct(parseInt(productId));
            console.log(`🟢 getProductPrediction: predicción generada para producto ${productId}`);
            res.json({
                success: true,
                data: prediction
            });
        }
        catch (error) {
            console.error('🔴 Error en getProductPrediction:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    // Obtener tendencias emergentes
    async getEmergingTrends(req, res) {
        console.log('🔵 getEmergingTrends llamado con period:', req.query.period);
        try {
            const { period } = req.query;
            let trends;
            if (period === 'month') {
                trends = await trendDetection_service_1.trendDetectionService.getMonthlyTrends();
            }
            else {
                trends = await trendDetection_service_1.trendDetectionService.getWeeklyTrends();
            }
            console.log(`🟢 getEmergingTrends: ${trends.length} tendencias encontradas`);
            res.json({
                success: true,
                data: trends
            });
        }
        catch (error) {
            console.error('🔴 Error en getEmergingTrends:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    // Obtener inteligencia de mercado (resumen)
    async getMarketIntelligence(req, res) {
        console.log('🔵 getMarketIntelligence llamado');
        try {
            const intelligence = await hybridPredictor_service_1.hybridPredictorService.getMarketIntelligence();
            console.log('🟢 getMarketIntelligence:', intelligence);
            res.json({
                success: true,
                data: intelligence
            });
        }
        catch (error) {
            console.error('🔴 Error en getMarketIntelligence:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    // Obtener categorías de alto riesgo estacional
    async getHighRiskCategories(req, res) {
        console.log('🔵 getHighRiskCategories llamado');
        try {
            const categories = seasonalMapping_service_1.seasonalMappingService.getHighRiskCategories();
            console.log(`🟢 getHighRiskCategories: ${categories.length} categorías encontradas`);
            res.json({
                success: true,
                data: categories
            });
        }
        catch (error) {
            console.error('🔴 Error en getHighRiskCategories:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}
exports.ProductIntelligenceController = ProductIntelligenceController;
exports.productIntelligenceController = new ProductIntelligenceController();

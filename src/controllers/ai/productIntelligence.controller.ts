import { Request, Response } from 'express';
import { hybridPredictorService } from '../../services/ai/hybridPredictor.service';
import { trendDetectionService } from '../../services/ai/trendDetection.service';
import { seasonalMappingService } from '../../services/ai/seasonalMapping.service';

export class ProductIntelligenceController {
  
  // ========== MÉTODO DE TEST ==========
  async test(req: Request, res: Response) {
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
  async getPredictions(req: Request, res: Response) {
    console.log('🔵 getPredictions llamado con query:', req.query);
    try {
      const { limit } = req.query;
      const predictions = await hybridPredictorService.predictForTopProducts(
        limit ? parseInt(limit as string) : 20
      );
      
      console.log(`🟢 getPredictions: ${predictions.length} predicciones generadas`);
      res.json({
        success: true,
        data: predictions
      });
    } catch (error: any) {
      console.error('🔴 Error en getPredictions:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Obtener predicción para un producto específico
  async getProductPrediction(req: Request, res: Response) {
    console.log(`🔵 getProductPrediction llamado para productId: ${req.params.productId}`);
    try {
      const { productId } = req.params;
      const prediction = await hybridPredictorService.predictForProduct(parseInt(productId));
      
      console.log(`🟢 getProductPrediction: predicción generada para producto ${productId}`);
      res.json({
        success: true,
        data: prediction
      });
    } catch (error: any) {
      console.error('🔴 Error en getProductPrediction:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Obtener tendencias emergentes
  async getEmergingTrends(req: Request, res: Response) {
    console.log('🔵 getEmergingTrends llamado con period:', req.query.period);
    try {
      const { period } = req.query;
      
      let trends;
      if (period === 'month') {
        trends = await trendDetectionService.getMonthlyTrends();
      } else {
        trends = await trendDetectionService.getWeeklyTrends();
      }
      
      console.log(`🟢 getEmergingTrends: ${trends.length} tendencias encontradas`);
      res.json({
        success: true,
        data: trends
      });
    } catch (error: any) {
      console.error('🔴 Error en getEmergingTrends:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Obtener inteligencia de mercado (resumen)
  async getMarketIntelligence(req: Request, res: Response) {
    console.log('🔵 getMarketIntelligence llamado');
    try {
      const intelligence = await hybridPredictorService.getMarketIntelligence();
      
      console.log('🟢 getMarketIntelligence:', intelligence);
      res.json({
        success: true,
        data: intelligence
      });
    } catch (error: any) {
      console.error('🔴 Error en getMarketIntelligence:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Obtener categorías de alto riesgo estacional
  async getHighRiskCategories(req: Request, res: Response) {
    console.log('🔵 getHighRiskCategories llamado');
    try {
      const categories = seasonalMappingService.getHighRiskCategories();
      
      console.log(`🟢 getHighRiskCategories: ${categories.length} categorías encontradas`);
      res.json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      console.error('🔴 Error en getHighRiskCategories:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

export const productIntelligenceController = new ProductIntelligenceController();
import { Request, Response } from 'express';
import { loyaltyService } from '../../services/ai/loyalty.service';

export class LoyaltyController {
  
  async getLoyaltySummary(req: Request, res: Response) {
    try {
      console.log('🔵 getLoyaltySummary llamado');
      const summary = await loyaltyService.getLoyaltySummary();
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      console.error('🔴 Error en getLoyaltySummary:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getClientLoyalty(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      console.log(`🔵 getClientLoyalty llamado para clientId: ${clientId}`);
      
      const loyalty = await loyaltyService.calculateClientPoints(parseInt(clientId));
      
      res.json({
        success: true,
        data: loyalty
      });
    } catch (error: any) {
      console.error('🔴 Error en getClientLoyalty:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getPointsInCirculation(req: Request, res: Response) {
    try {
      console.log('🔵 getPointsInCirculation llamado');
      const points = await loyaltyService.getTotalPointsInCirculation();
      
      res.json({
        success: true,
        data: points
      });
    } catch (error: any) {
      console.error('🔴 Error en getPointsInCirculation:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getChronicPatients(req: Request, res: Response) {
    try {
      console.log('🔵 getChronicPatients llamado');
      const patients = await loyaltyService.getChronicPatients();
      
      res.json({
        success: true,
        data: patients
      });
    } catch (error: any) {
      console.error('🔴 Error en getChronicPatients:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getDormantClients(req: Request, res: Response) {
    try {
      const { days } = req.query;
      console.log(`🔵 getDormantClients llamado con days: ${days}`);
      
      const clients = await loyaltyService.getDormantClients(days ? parseInt(days as string) : 90);
      
      res.json({
        success: true,
        data: clients
      });
    } catch (error: any) {
      console.error('🔴 Error en getDormantClients:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTierAnalysis(req: Request, res: Response) {
    try {
      console.log('🔵 getTierAnalysis llamado');
      const analysis = await loyaltyService.getTierAnalysis();
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      console.error('🔴 Error en getTierAnalysis:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getFavoriteCategoriesByTier(req: Request, res: Response) {
    try {
      const { tier } = req.params;
      console.log(`🔵 getFavoriteCategoriesByTier llamado para tier: ${tier}`);
      
      const categories = await loyaltyService.getFavoriteCategoriesByTier(tier as 'Or');
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      console.error('🔴 Error en getFavoriteCategoriesByTier:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const loyaltyController = new LoyaltyController();
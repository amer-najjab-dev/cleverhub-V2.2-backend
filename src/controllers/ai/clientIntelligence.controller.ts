import { Request, Response } from 'express';
import { clientIntelligenceService } from '../../services/ai/clientIntelligence.service';

export class ClientIntelligenceController {
  
  async getClientIntelligence(req: Request, res: Response) {
    try {
      console.log('🔵 getClientIntelligence llamado');
      const intelligence = await clientIntelligenceService.getClientIntelligence();
      
      res.json({
        success: true,
        data: intelligence
      });
    } catch (error: any) {
      console.error('🔴 Error en getClientIntelligence:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllRiskScores(req: Request, res: Response) {
    try {
      console.log('🔵 getAllRiskScores llamado');
      const scores = await clientIntelligenceService.calculateAllRiskScores();
      
      res.json({
        success: true,
        data: scores
      });
    } catch (error: any) {
      console.error('🔴 Error en getAllRiskScores:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getClientRiskScore(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      console.log(`🔵 getClientRiskScore llamado para clientId: ${clientId}`);
      
      const score = await clientIntelligenceService.calculateRiskScore(parseInt(clientId));
      
      res.json({
        success: true,
        data: score
      });
    } catch (error: any) {
      console.error('🔴 Error en getClientRiskScore:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getClientSegments(req: Request, res: Response) {
    try {
      console.log('🔵 getClientSegments llamado');
      const segments = await clientIntelligenceService.getClientSegments();
      
      res.json({
        success: true,
        data: segments
      });
    } catch (error: any) {
      console.error('🔴 Error en getClientSegments:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getClientPurchaseBehavior(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      console.log(`🔵 getClientPurchaseBehavior llamado para clientId: ${clientId}`);
      
      const behavior = await clientIntelligenceService.getPurchaseBehavior(parseInt(clientId));
      
      res.json({
        success: true,
        data: behavior
      });
    } catch (error: any) {
      console.error('🔴 Error en getClientPurchaseBehavior:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const clientIntelligenceController = new ClientIntelligenceController();
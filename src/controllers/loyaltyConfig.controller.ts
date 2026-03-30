// backend/src/controllers/loyaltyConfig.controller.ts
import { Request, Response } from 'express';
import { loyaltyConfigService } from '../services/loyaltyConfig.service';

// Extender el tipo Request para incluir el usuario autenticado
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    pharmacyId: number;
  };
}

export class LoyaltyConfigController {
  
  async getConfig(req: AuthRequest, res: Response) {
    try {
      // Obtener pharmacyId del usuario autenticado
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Usuario sin farmacia asignada' 
        });
      }
      
      const config = await loyaltyConfigService.getConfig(pharmacyId);
      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('Error getting config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateConfig(req: AuthRequest, res: Response) {
    try {
      // Obtener pharmacyId del usuario autenticado
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Usuario sin farmacia asignada' 
        });
      }
      
      const config = await loyaltyConfigService.updateConfig(pharmacyId, req.body);
      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('Error updating config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStatistics(req: AuthRequest, res: Response) {
    try {
      // Obtener pharmacyId del usuario autenticado
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Usuario sin farmacia asignada' 
        });
      }
      
      const stats = await loyaltyConfigService.getStats(pharmacyId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Error getting statistics:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async simulatePoints(req: AuthRequest, res: Response) {
    try {
      // Obtener pharmacyId del usuario autenticado
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Usuario sin farmacia asignada' 
        });
      }
      
      const { amount, isFirstPurchase, isBirthday } = req.query;
      const config = await loyaltyConfigService.getConfig(pharmacyId);
      const pointsEarned = Math.floor((parseFloat(amount as string) || 0) / config.currencyUnit) * config.pointsPerUnit;
      const result = {
        pointsEarned,
        multiplier: 1,
        totalPoints: pointsEarned
      };
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error simulating points:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async resetToDefault(req: AuthRequest, res: Response) {
    try {
      // Obtener pharmacyId del usuario autenticado
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Usuario sin farmacia asignada' 
        });
      }
      
      const config = await loyaltyConfigService.updateConfig(pharmacyId, {
        pointsPerUnit: 1,
        currencyUnit: 10,
  minPurchaseForPoints: 0,
        pointsExpiryDays: 365,
        welcomePoints: 100,
        birthdayMultiplier: 2.0,
        firstPurchaseMultiplier: 1.5,
        tierThresholds: {
          bronze: 0,
          silver: 2000,
          gold: 5000
        }
      });
      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('Error resetting config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const loyaltyConfigController = new LoyaltyConfigController();
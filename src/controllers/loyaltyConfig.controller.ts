// backend/src/controllers/loyaltyConfig.controller.ts
import { Request, Response } from 'express';
import { loyaltyConfigService } from '../services/loyaltyConfig.service';

export class LoyaltyConfigController {
  
  async getConfig(req: Request, res: Response) {
    try {
      const config = await loyaltyConfigService.getActiveConfig();
      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('Error getting config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateConfig(req: Request, res: Response) {
    try {
      const config = await loyaltyConfigService.updateConfig(req.body);
      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('Error updating config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await loyaltyConfigService.getPointsStatistics();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Error getting statistics:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async simulatePoints(req: Request, res: Response) {
    try {
      const { amount, isFirstPurchase, isBirthday } = req.query;
      const result = loyaltyConfigService.simulatePoints(
        parseFloat(amount as string) || 0,
        isFirstPurchase === 'true',
        isBirthday === 'true'
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error simulating points:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async resetToDefault(req: Request, res: Response) {
    try {
      const config = await loyaltyConfigService.updateConfig({
        pointsPerUnit: 1,
        currencyUnit: 10,
        minPurchaseForPoints: 0,
        pointsExpiryDays: 365,
        welcomePoints: 100,
        birthdayMultiplier: 2.0,
        firstPurchaseMultiplier: 1.5,
        tierThresholds: {
          bronze: { min: 0, max: 1999 },
          argent: { min: 2000, max: 4999 },
          or: { min: 5000, max: 999999 }
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
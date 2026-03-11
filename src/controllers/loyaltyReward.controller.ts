import { Request, Response } from 'express';
import { loyaltyRewardService } from '../services/loyaltyReward.service';

export class LoyaltyRewardController {
  
  // ========== RECOMPENSAS ==========
  
  async getAllRewards(req: Request, res: Response) {
    try {
      const { activeOnly } = req.query;
      const rewards = await loyaltyRewardService.getAllRewards(activeOnly !== 'false');
      res.json({ success: true, data: rewards });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createReward(req: Request, res: Response) {
    try {
      const reward = await loyaltyRewardService.createReward(req.body);
      res.json({ success: true, data: reward });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateReward(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reward = await loyaltyRewardService.updateReward(parseInt(id), req.body);
      res.json({ success: true, data: reward });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteReward(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await loyaltyRewardService.deleteReward(parseInt(id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========== PACKS ==========

  async getAllPacks(req: Request, res: Response) {
    try {
      const { activeOnly } = req.query;
      const packs = await loyaltyRewardService.getAllPacks(activeOnly !== 'false');
      res.json({ success: true, data: packs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createPack(req: Request, res: Response) {
    try {
      const pack = await loyaltyRewardService.createPack(req.body);
      res.json({ success: true, data: pack });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========== CANJES ==========

  async redeemReward(req: Request, res: Response) {
    try {
      const { clientId, rewardId } = req.params;
      const { saleId } = req.body;
      
      const result = await loyaltyRewardService.redeemReward(
        parseInt(clientId), 
        parseInt(rewardId), 
        saleId
      );
      
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async redeemPack(req: Request, res: Response) {
    try {
      const { clientId, packId } = req.params;
      const { saleId } = req.body;
      
      const result = await loyaltyRewardService.redeemPack(
        parseInt(clientId), 
        parseInt(packId), 
        saleId
      );
      
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========== REPORTES ==========

  async getLoyaltyClosure(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const closure = await loyaltyRewardService.getLoyaltyClosure(new Date(date as string));
      res.json({ success: true, data: closure });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========== IA STRATEGIST ==========

  async getPromotionSuggestions(req: Request, res: Response) {
    try {
      const suggestions = await loyaltyRewardService.getPromotionSuggestions();
      res.json({ success: true, data: suggestions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getWeeklyStrategy(req: Request, res: Response) {
    try {
      const strategy = await loyaltyRewardService.getWeeklyStrategy();
      res.json({ success: true, data: strategy });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const loyaltyRewardController = new LoyaltyRewardController();
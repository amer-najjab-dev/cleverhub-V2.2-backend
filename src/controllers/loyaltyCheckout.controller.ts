import { Request, Response } from 'express';
import { loyaltyRewardService } from '../services/loyaltyReward.service';
import { AppDataSource } from '../data-source';
import { Client } from '../entities/Client';
import { LoyaltyReward } from '../entities/LoyaltyReward';
import { LoyaltyPack } from '../entities/LoyaltyPack';

export class LoyaltyCheckoutController {
  
  // Obtener recompensas disponibles para un cliente
  async getAvailableRewards(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      
      const clientRepo = AppDataSource.getRepository(Client);
      const rewardRepo = AppDataSource.getRepository(LoyaltyReward);
      const packRepo = AppDataSource.getRepository(LoyaltyPack);
      
      // Obtener puntos del cliente
      const client = await clientRepo.findOne({ where: { id: parseInt(clientId) } });
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client non trouvé' });
      }
      
      const clientPoints = client.loyaltyPoints || 0;
      
      // Obtener todas las recompensas activas con productos
      const rewards = await rewardRepo.find({
        where: { isActive: true },
        relations: ['product']
      });
      
      // Obtener todos los packs activos con productos
      const packs = await packRepo.find({
        where: { isActive: true },
        relations: ['products']
      });
      
      const available = [];
      
      // Filtrar recompensas que el cliente puede pagar
      for (const reward of rewards) {
        if (reward.pointsCost <= clientPoints && reward.product?.stock > 0) {
          available.push({
            id: reward.id,
            type: 'reward',
            name: reward.product.name,
            pointsCost: reward.pointsCost,
            productId: reward.productId,
            product: {
              id: reward.product.id,
              name: reward.product.name,
              pricePPV: reward.product.pricePPV,
              stock: reward.product.stock
            },
            originalValue: parseFloat(reward.product.pricePPV.toString())
          });
        }
      }
      
      // Filtrar packs que el cliente puede pagar
      for (const pack of packs) {
        if (pack.pointsCost <= clientPoints) {
          // Verificar stock de todos los productos
          const hasStock = pack.products.every(p => p.stock > 0);
          if (hasStock) {
            available.push({
              id: pack.id,
              type: 'pack',
              name: pack.name,
              pointsCost: pack.pointsCost,
              products: pack.products.map(p => ({
                id: p.id,
                name: p.name,
                pricePPV: p.pricePPV,
                stock: p.stock
              })),
              originalValue: pack.products.reduce((sum, p) => sum + parseFloat(p.pricePPV.toString()), 0)
            });
          }
        }
      }
      
      res.json({
        success: true,
        data: available,
        clientPoints
      });
      
    } catch (error: any) {
      console.error('Error getting available rewards:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Canjear múltiples items a la vez
  async redeemItems(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const { items, saleId } = req.body;
      
      const results = [];
      
      for (const item of items) {
        if (item.type === 'reward') {
          const result = await loyaltyRewardService.redeemReward(
            parseInt(clientId),
            item.id,
            saleId
          );
          results.push(result);
        } else if (item.type === 'pack') {
          const result = await loyaltyRewardService.redeemPack(
            parseInt(clientId),
            item.id,
            saleId
          );
          results.push(result);
        }
      }
      
      res.json({
        success: true,
        data: results
      });
      
    } catch (error: any) {
      console.error('Error redeeming items:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const loyaltyCheckoutController = new LoyaltyCheckoutController();
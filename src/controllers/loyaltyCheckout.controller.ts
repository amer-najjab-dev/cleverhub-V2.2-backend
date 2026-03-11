import { Request, Response } from 'express';
import { prisma } from '../server';

export class LoyaltyCheckoutController {
  
  // Obtener recompensas disponibles para un cliente
  async getAvailableRewards(req: Request, res: Response) {
    try {
      const { clientId } = req.params;

      const client = await prisma.clients.findUnique({
        where: { id: parseInt(clientId) },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé',
        });
      }

      const rewards = await prisma.loyalty_reward.findMany({
        where: {
          is_active: true,
          AND: [
            {
              OR: [
                { start_date: null },
                { start_date: { lte: new Date() } },
              ],
            },
            {
              OR: [
                { end_date: null },
                { end_date: { gte: new Date() } },
              ],
            },
          ],
        },
        include: {
          product: true,
        },
        orderBy: {
          points_cost: 'asc',
        },
      });

      const availableRewards = rewards
        .filter((r: any) => (client.loyalty_points || 0) >= r.points_cost)
        .map((r: any) => ({
          id: r.id,
          productId: r.product_id,
          productName: r.product?.name,
          productImage: r.product?.imageUrl,
          pointsCost: r.points_cost,
          description: r.description,
          stock: r.product?.stock || 0,
        }));

      const unavailableRewards = rewards
        .filter((r: any) => (client.loyalty_points || 0) < r.points_cost)
        .map((r: any) => ({
          id: r.id,
          productId: r.product_id,
          productName: r.product?.name,
          pointsCost: r.points_cost,
          pointsNeeded: r.points_cost - (client.loyalty_points || 0),
        }));

      res.json({
        success: true,
        data: {
          clientPoints: client.loyalty_points || 0,
          available: availableRewards,
          upcoming: unavailableRewards.slice(0, 5),
        },
      });
    } catch (error: any) {
      console.error('Error getting available rewards:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Obtener packs disponibles para un cliente
  async getAvailablePacks(req: Request, res: Response) {
    try {
      const { clientId } = req.params;

      const client = await prisma.clients.findUnique({
        where: { id: parseInt(clientId) },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé',
        });
      }

      const packs = await prisma.loyalty_pack.findMany({
        where: {
          is_active: true,
          AND: [
            {
              OR: [
                { start_date: null },
                { start_date: { lte: new Date() } },
              ],
            },
            {
              OR: [
                { end_date: null },
                { end_date: { gte: new Date() } },
              ],
            },
          ],
        },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          points_cost: 'asc',
        },
      });

      const availablePacks = packs
        .filter((p: any) => (client.loyalty_points || 0) >= p.points_cost)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          pointsCost: p.points_cost,
          imageUrl: p.image_url,
          products: p.products.map((pp: any) => ({
            id: pp.product.id,
            name: pp.product.name,
            imageUrl: pp.product.imageUrl,
          })),
        }));

      res.json({
        success: true,
        data: {
          clientPoints: client.loyalty_points || 0,
          available: availablePacks,
        },
      });
    } catch (error: any) {
      console.error('Error getting available packs:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Validar si un cliente puede canjear una recompensa
  async validateRewardRedemption(req: Request, res: Response) {
    try {
      const { clientId, rewardId } = req.params;

      const [client, reward] = await Promise.all([
        prisma.clients.findUnique({
          where: { id: parseInt(clientId) },
        }),
        prisma.loyalty_reward.findUnique({
          where: { id: parseInt(rewardId) },
          include: { product: true },
        }),
      ]);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé',
        });
      }

      if (!reward) {
        return res.status(404).json({
          success: false,
          message: 'Récompense non trouvée',
        });
      }

      const hasEnoughPoints = (client.loyalty_points || 0) >= reward.points_cost;
      const hasStock = (reward.product?.stock || 0) > 0;
      const isActive = reward.is_active;

      const errors: string[] = [];
      if (!hasEnoughPoints) errors.push('Points insuffisants');
      if (!hasStock) errors.push('Produit en rupture de stock');
      if (!isActive) errors.push('Récompense non active');

      res.json({
        success: true,
        data: {
          isValid: hasEnoughPoints && hasStock && isActive,
          clientPoints: client.loyalty_points || 0,
          rewardPoints: reward.points_cost,
          hasEnoughPoints,
          hasStock,
          isActive,
          errors,
        },
      });
    } catch (error: any) {
      console.error('Error validating redemption:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Validar si un cliente puede canjear un pack
  async validatePackRedemption(req: Request, res: Response) {
    try {
      const { clientId, packId } = req.params;

      const [client, pack] = await Promise.all([
        prisma.clients.findUnique({
          where: { id: parseInt(clientId) },
        }),
        prisma.loyalty_pack.findUnique({
          where: { id: parseInt(packId) },
          include: {
            products: {
              include: { product: true },
            },
          },
        }),
      ]);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé',
        });
      }

      if (!pack) {
        return res.status(404).json({
          success: false,
          message: 'Pack non trouvé',
        });
      }

      const hasEnoughPoints = (client.loyalty_points || 0) >= pack.points_cost;
      const hasStock = pack.products.every((p: any) => p.product.stock > 0);
      const isActive = pack.is_active;

      const errors: string[] = [];
      if (!hasEnoughPoints) errors.push('Points insuffisants');
      if (!hasStock) errors.push('Certains produits sont en rupture de stock');
      if (!isActive) errors.push('Pack non actif');

      res.json({
        success: true,
        data: {
          isValid: hasEnoughPoints && hasStock && isActive,
          clientPoints: client.loyalty_points || 0,
          packPoints: pack.points_cost,
          hasEnoughPoints,
          hasStock,
          isActive,
          errors,
          products: pack.products.map((p: any) => ({
            name: p.product.name,
            hasStock: p.product.stock > 0,
          })),
        },
      });
    } catch (error: any) {
      console.error('Error validating pack redemption:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Obtener historial de canjes del cliente
  async getClientRedemptions(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const { limit = 10 } = req.query;

      const transactions = await prisma.loyalty_transactions.findMany({
        where: {
          client_id: parseInt(clientId),
          type: 'redeemed',
        },
        include: {
          reward: {
            include: { product: true },
          },
          pack: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: Number(limit),
      });

      const redemptions = transactions.map((t: any) => ({
        id: t.id,
        date: t.created_at,
        points: Math.abs(t.points),
        type: t.reward ? 'reward' : 'pack',
        name: t.reward?.product?.name || t.pack?.name,
        reason: t.reason,
        value: t.product_value,
      }));

      res.json({
        success: true,
        data: redemptions,
      });
    } catch (error: any) {
      console.error('Error getting client redemptions:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export const loyaltyCheckoutController = new LoyaltyCheckoutController();

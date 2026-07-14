import { prisma } from '../server';

export class LoyaltyRewardService {
  
  // ========== RECOMPENSAS ==========
  
  async getAllRewards(activeOnly: boolean = true) {
    const where: any = {};
    if (activeOnly) {
      where.is_active = true;
    }

    const rewards = await prisma.loyalty_rewards.findMany({
      where,
      include: {
        products: true,
      },
      orderBy: {
        points_cost: 'asc',
      },
    });

    return rewards.map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product?.name,
      pointsCost: r.points_cost,
      isActive: r.is_active,
      description: r.description,
      imageUrl: r.image_url,
      maxQuantity: r.max_quantity,
      startDate: r.start_date,
      endDate: r.end_date,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async createReward(data: any) {
    const reward = await prisma.loyalty_rewards.create({
      data: {
        product_id: data.productId,
        points_cost: data.pointsCost,
        is_active: data.isActive ?? true,
        description: data.description,
        image_url: data.imageUrl,
        max_quantity: data.maxQuantity,
        start_date: data.startDate,
        end_date: data.endDate,
      },
      include: {
        products: true,
      },
    });

    return reward;
  }

  async updateReward(id: number, data: any) {
    const reward = await prisma.loyalty_rewards.update({
      where: { id },
      data: {
        product_id: data.productId,
        points_cost: data.pointsCost,
        is_active: data.isActive,
        description: data.description,
        image_url: data.imageUrl,
        max_quantity: data.maxQuantity,
        start_date: data.startDate,
        end_date: data.endDate,
      },
      include: {
        products: true,
      },
    });

    return reward;
  }

  async deleteReward(id: number) {
    await prisma.loyalty_rewards.delete({
      where: { id },
    });
    return { success: true };
  }

  // ========== PACKS ==========

  async getAllPacks(activeOnly: boolean = true) {
    const where: any = {};
    if (activeOnly) {
      where.is_active = true;
    }

    const packs = await prisma.loyalty_packs.findMany({
      where,
      include: {
        loyalty_pack_products: {
          include: {
            products: true,  // ← la relación en la tabla intermedia se llama 'products'
          },
        },
      },
      orderBy: {
        points_cost: 'asc',
      },
    });

    return packs.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      pointsCost: p.points_cost,
      isActive: p.is_active,
      imageUrl: p.image_url,
      maxQuantity: p.max_quantity,
      startDate: p.start_date,
      endDate: p.end_date,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      products: p.products.map((pp: any) => ({
        productId: pp.product.id,
        productName: pp.product.name,
      })),
    }));
  }

  async createPack(data: any) {
    const pack = await prisma.loyalty_packs.create({
      data: {
        name: data.name,
        description: data.description,
        points_cost: data.pointsCost,
        is_active: data.isActive ?? true,
        image_url: data.imageUrl,
        max_quantity: data.maxQuantity,
        start_date: data.startDate,
        end_date: data.endDate,
        loyalty_pack_products: {
          create: data.productIds.map((productId: number) => ({
            product_id: productId,
          })),
        },
      },
      include: {
        loyalty_pack_products: {
          include: {
            products: true,
          },
        },
      },
    });

    return pack;
  }

  // ========== CANJES ==========

  async redeemReward(clientId: number, rewardId: number, saleId?: number) {
    return await prisma.$transaction(async (tx: any) => {
      const reward = await tx.loyalty_reward.findUnique({
        where: { id: rewardId },
        include: { product: true },
      });

      if (!reward) throw new Error('Récompense non trouvée');

      const client = await tx.clients.findUnique({
        where: { id: clientId },
      });

      if (!client) throw new Error('Client non trouvé');

      // Verificar puntos
      if ((client.loyalty_points || 0) < reward.points_cost) {
        throw new Error('Points insuffisants');
      }

      // Crear transacción
      const transaction = await tx.loyalty_transactions.create({
        data: {
          client_id: clientId,
          points: -reward.points_cost,
          type: 'redeemed',
          reason: `Canje de recompensa: ${reward.product?.name || 'Producto'}`,
          reward_id: rewardId,
          sale_id: saleId,
          product_value: reward.product?.pricePPV,
        },
      });

      // Actualizar puntos del cliente
      await tx.clients.update({
        where: { id: clientId },
        data: {
          loyalty_points: {
            decrement: reward.points_cost,
          },
        },
      });

      return transaction;
    });
  }

  async redeemPack(clientId: number, packId: number, saleId?: number) {
    return await prisma.$transaction(async (tx: any) => {
      const pack = await tx.loyalty_pack.findUnique({
        where: { id: packId },
        include: {
          products: {
            include: { product: true },
          },
        },
      });

      if (!pack) throw new Error('Pack non trouvé');

      const client = await tx.clients.findUnique({
        where: { id: clientId },
      });

      if (!client) throw new Error('Client non trouvé');

      if ((client.loyalty_points || 0) < pack.points_cost) {
        throw new Error('Points insuffisants');
      }

      // Calcular valor total del pack
      const totalValue = pack.products.reduce((sum: number, p: any) => 
        sum + Number(p.product.pricePPV), 0
      );

      // Crear transacción
      const transaction = await tx.loyalty_transactions.create({
        data: {
          client_id: clientId,
          points: -pack.points_cost,
          type: 'redeemed',
          reason: `Canje de pack: ${pack.name}`,
          pack_id: packId,
          sale_id: saleId,
          product_value: totalValue,
        },
      });

      // Actualizar puntos
      await tx.clients.update({
        where: { id: clientId },
        data: {
          loyalty_points: {
            decrement: pack.points_cost,
          },
        },
      });

      return transaction;
    });
  }

  // ========== REPORTES ==========

  async getLoyaltyClosure(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await prisma.loyalty_transactions.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        clients: true,
        loyalty_rewards: {
          include: { products: true },
        },
        loyalty_packs: true,
      }
    });

    const earnedPoints = transactions
      .filter((t: any) => t.type === 'earned' || t.type === 'bonus')
      .reduce((sum: number, t: any) => sum + t.points, 0);

    const redeemedPoints = transactions
      .filter((t: any) => t.type === 'redeemed')
      .reduce((sum: number, t: any) => sum + Math.abs(t.points), 0);

    const redeemedValue = transactions
      .filter((t: any) => t.type === 'redeemed')
      .reduce((sum: number, t: any) => sum + Number(t.product_value || 0), 0);

    return {
      date: startOfDay.toISOString().split('T')[0],
      summary: {
        totalTransactions: transactions.length,
        earnedPoints,
        redeemedPoints,
        netPoints: earnedPoints - redeemedPoints,
        redeemedValue,
      },
      transactions: transactions.map((t: any) => ({
        id: t.id,
        clientName: `${t.client?.first_name || ''} ${t.client?.last_name || ''}`.trim(),
        points: t.points,
        type: t.type,
        reason: t.reason,
        productName: t.reward?.product?.name || t.pack?.name,
        createdAt: t.created_at,
      })),
    };
  }

  // ========== IA STRATEGIST ==========

  async getPromotionSuggestions() {
    const [rewards, packs] = await Promise.all([
      this.getAllRewards(true),
      this.getAllPacks(true),
    ]);

    const transactions = await prisma.loyalty_transactions.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
        },
      },
      include: {
        loyalty_rewards: {
          include: { products: true },
        },
        loyalty_packs: true,
      },
    });

    const redeemedCount: Record<number, number> = {};
    transactions.forEach((t: any) => {
      if (t.reward_id) {
        redeemedCount[t.reward_id] = (redeemedCount[t.reward_id] || 0) + 1;
      }
    });

    const suggestions = [];

    // Sugerencias para recompensas populares
    for (const [rewardId, count] of Object.entries(redeemedCount)) {
      if (count > 5) {
        const reward = rewards.find((r: any) => r.id === parseInt(rewardId));
        if (reward) {
          suggestions.push({
            type: 'reward',
            id: parseInt(rewardId),
            name: reward.productName,
            reason: `Canjeado ${count} veces en los últimos 30 días`,
            action: 'Considerar aumentar stock o crear promoción similar',
          });
        }
      }
    }

    return suggestions;
  }

  async getWeeklyStrategy() {
    const [closure, suggestions] = await Promise.all([
      this.getLoyaltyClosure(new Date()),
      this.getPromotionSuggestions(),
    ]);

    const activeRewards = await this.getAllRewards(true);
    const activePacks = await this.getAllPacks(true);

    return {
      weekOf: new Date().toISOString().split('T')[0],
      summary: {
        activeRewards: activeRewards.length,
        activePacks: activePacks.length,
        pointsEarnedThisWeek: closure.summary.earnedPoints,
        pointsRedeemedThisWeek: closure.summary.redeemedPoints,
        valueRedeemedThisWeek: closure.summary.redeemedValue,
      },
      suggestions,
      featuredRewards: activeRewards.slice(0, 3),
      featuredPacks: activePacks.slice(0, 3),
    };
  }
}

export const loyaltyRewardService = new LoyaltyRewardService();

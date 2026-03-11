import { prisma } from '../server';

export class LoyaltyConfigService {
  
  async getActiveConfig() {
    const config = await prisma.loyalty_config.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    if (!config) {
      // Si no hay configuración activa, crear una por defecto
      return this.createDefaultConfig();
    }

    return {
      id: config.id,
      pointsPerUnit: config.points_per_unit,
      currencyUnit: config.currency_unit,
      minPurchaseForPoints: config.min_purchase_for_points,
      pointsExpiryDays: config.points_expiry_days,
      welcomePoints: config.welcome_points,
      birthdayMultiplier: config.birthday_multiplier,
      firstPurchaseMultiplier: config.first_purchase_multiplier,
      tierThresholds: config.tier_thresholds || {
        bronze: { min: 0, max: 1999 },
        argent: { min: 2000, max: 4999 },
        or: { min: 5000, max: 999999 },
      },
      createdAt: config.created_at,
      updatedAt: config.updated_at,
    };
  }

  async updateConfig(data: any) {
    // Desactivar configuraciones anteriores
    await prisma.loyalty_config.updateMany({
      where: { is_active: true },
      data: { is_active: false },
    });

    // Crear nueva configuración
    const config = await prisma.loyalty_config.create({
      data: {
        points_per_unit: data.pointsPerUnit,
        currency_unit: data.currencyUnit,
        min_purchase_for_points: data.minPurchaseForPoints,
        points_expiry_days: data.pointsExpiryDays,
        welcome_points: data.welcomePoints,
        birthday_multiplier: data.birthdayMultiplier,
        first_purchase_multiplier: data.firstPurchaseMultiplier,
        tier_thresholds: data.tierThresholds,
        is_active: true,
      },
    });

    return config;
  }

  async getPointsStatistics() {
    const [totalPoints, activeClients, averagePoints] = await Promise.all([
      prisma.clients.aggregate({
        _sum: {
          loyalty_points: true,
        },
      }),
      prisma.clients.count({
        where: {
          loyalty_points: {
            gt: 0,
          },
        },
      }),
      prisma.clients.aggregate({
        _avg: {
          loyalty_points: true,
        },
      }),
    ]);

    const recentActivity = await prisma.loyalty_transactions.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      totalPointsInCirculation: totalPoints._sum?.loyalty_points || 0,
      activeClientsWithPoints: activeClients,
      averagePointsPerClient: Math.round(averagePoints._avg?.loyalty_points || 0),
      recentTransactions30d: recentActivity,
    };
  }

  simulatePoints(amount: number, isFirstPurchase: boolean, isBirthday: boolean) {
    const config = {
      pointsPerUnit: 1,
      currencyUnit: 10,
      birthdayMultiplier: 2.0,
      firstPurchaseMultiplier: 1.5,
    };

    let basePoints = Math.floor(amount / config.currencyUnit) * config.pointsPerUnit;
    let multiplier = 1;

    if (isFirstPurchase) multiplier *= config.firstPurchaseMultiplier;
    if (isBirthday) multiplier *= config.birthdayMultiplier;

    const totalPoints = Math.round(basePoints * multiplier);

    return {
      baseAmount: amount,
      basePoints,
      multiplier,
      totalPoints,
      breakdown: {
        regular: basePoints,
        bonus: totalPoints - basePoints,
      },
    };
  }

  private async createDefaultConfig() {
    const defaultConfig = {
      points_per_unit: 1,
      currency_unit: 10,
      min_purchase_for_points: 0,
      points_expiry_days: 365,
      welcome_points: 100,
      birthday_multiplier: 2.0,
      first_purchase_multiplier: 1.5,
      tier_thresholds: {
        bronze: { min: 0, max: 1999 },
        argent: { min: 2000, max: 4999 },
        or: { min: 5000, max: 999999 },
      },
      is_active: true,
    };

    const config = await prisma.loyalty_config.create({
      data: defaultConfig,
    });

    return {
      id: config.id,
      pointsPerUnit: config.points_per_unit,
      currencyUnit: config.currency_unit,
      minPurchaseForPoints: config.min_purchase_for_points,
      pointsExpiryDays: config.points_expiry_days,
      welcomePoints: config.welcome_points,
      birthdayMultiplier: config.birthday_multiplier,
      firstPurchaseMultiplier: config.first_purchase_multiplier,
      tierThresholds: config.tier_thresholds,
      createdAt: config.created_at,
      updatedAt: config.updated_at,
    };
  }
}

export const loyaltyConfigService = new LoyaltyConfigService();

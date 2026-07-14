import { prisma } from '../server';

export interface LoyaltyConfigData {
  pointsPerUnit: number;
  currencyUnit: number;
  minPurchaseForPoints: number;
  pointsExpiryDays: number;
  welcomePoints: number;
  birthdayMultiplier: number;
  firstPurchaseMultiplier: number;
  tierThresholds: {
    bronze: number;
    silver: number;
    gold: number;
  };
}

export class LoyaltyConfigService {
  
  async getConfig(pharmacyId: number) {
    const config = await prisma.loyalty_config.findFirst({
      where: { pharmacy_id: pharmacyId }
    });
    
    if (!config) {
      return this.getDefaultConfig();
    }
    
    return {
      pointsPerUnit: config.points_per_unit,
      currencyUnit: config.currency_unit,
      minPurchaseForPoints: config.min_purchase_for_points,
      pointsExpiryDays: config.points_expiry_days,
      welcomePoints: config.welcome_points,
      birthdayMultiplier: config.birthday_multiplier,
      firstPurchaseMultiplier: config.first_purchase_multiplier,
      tierThresholds: config.tier_thresholds as any,
    };
  }
  
  async updateConfig(pharmacyId: number, data: LoyaltyConfigData) {
    const existing = await prisma.loyalty_config.findFirst({
      where: { pharmacy_id: pharmacyId }
    });
    
    if (existing) {
      return prisma.loyalty_config.update({
        where: { id: existing.id },
        data: {
          points_per_unit: data.pointsPerUnit,
          currency_unit: data.currencyUnit,
          min_purchase_for_points: data.minPurchaseForPoints,
          points_expiry_days: data.pointsExpiryDays,
          welcome_points: data.welcomePoints,
          birthday_multiplier: data.birthdayMultiplier,
          first_purchase_multiplier: data.firstPurchaseMultiplier,
          tier_thresholds: data.tierThresholds,
          updated_at: new Date(),
        }
      });
    }
    
    return prisma.loyalty_config.create({
      data: {
        points_per_unit: data.pointsPerUnit,
        currency_unit: data.currencyUnit,
        min_purchase_for_points: data.minPurchaseForPoints,
        points_expiry_days: data.pointsExpiryDays,
        welcome_points: data.welcomePoints,
        birthday_multiplier: data.birthdayMultiplier,
        first_purchase_multiplier: data.firstPurchaseMultiplier,
        tier_thresholds: data.tierThresholds,
        pharmacy_id: pharmacyId,
        is_active: true,
      }
    });
  }
  
  async initializeDefaultConfig(pharmacyId: number) {
    const defaultConfig = this.getDefaultConfig();
    
    return prisma.loyalty_config.create({
      data: {
        points_per_unit: defaultConfig.pointsPerUnit,
        currency_unit: defaultConfig.currencyUnit,
        min_purchase_for_points: defaultConfig.minPurchaseForPoints,
        points_expiry_days: defaultConfig.pointsExpiryDays,
        welcome_points: defaultConfig.welcomePoints,
        birthday_multiplier: defaultConfig.birthdayMultiplier,
        first_purchase_multiplier: defaultConfig.firstPurchaseMultiplier,
        tier_thresholds: defaultConfig.tierThresholds,
        pharmacy_id: pharmacyId,
        is_active: true,
      }
    });
  }
  
  private getDefaultConfig(): LoyaltyConfigData {
    return {
      pointsPerUnit: 1,
      currencyUnit: 10,
      minPurchaseForPoints: 0,
      pointsExpiryDays: 365,
      welcomePoints: 100,
      birthdayMultiplier: 2,
      firstPurchaseMultiplier: 1.5,
      tierThresholds: {
        bronze: 0,
        silver: 1000,
        gold: 5000,
      }
    };
  }
  
  async getStats(pharmacyId: number) {
    const config = await this.getConfig(pharmacyId);
    
    const totalClients = await prisma.clients.count({
      where: { pharmacy_id: pharmacyId }
    });
    
    const activeClients = await prisma.clients.count({
      where: { 
        pharmacy_id: pharmacyId,
        total_purchases: { gt: 0 }
      }
    });
    
    const totalPoints = await prisma.clients.aggregate({
      where: { pharmacy_id: pharmacyId },
      _sum: { loyalty_points: true }
    });
    
    const recentActivity = await prisma.loyalty_transactions.count({
      where: {
        clients: { pharmacy_id: pharmacyId },
        created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    });
    
    return {
      config,
      stats: {
        totalClients,
        activeClients,
        totalPoints: totalPoints._sum.loyalty_points || 0,
        recentActivity,
      }
    };
  }
}

export const loyaltyConfigService = new LoyaltyConfigService();

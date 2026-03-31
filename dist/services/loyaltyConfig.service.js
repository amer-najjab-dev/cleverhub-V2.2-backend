"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyConfigService = exports.LoyaltyConfigService = void 0;
const server_1 = require("../server");
class LoyaltyConfigService {
    async getConfig(pharmacyId) {
        const config = await server_1.prisma.loyalty_config.findFirst({
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
            tierThresholds: config.tier_thresholds,
        };
    }
    async updateConfig(pharmacyId, data) {
        const existing = await server_1.prisma.loyalty_config.findFirst({
            where: { pharmacy_id: pharmacyId }
        });
        if (existing) {
            return server_1.prisma.loyalty_config.update({
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
        return server_1.prisma.loyalty_config.create({
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
    async initializeDefaultConfig(pharmacyId) {
        const defaultConfig = this.getDefaultConfig();
        return server_1.prisma.loyalty_config.create({
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
    getDefaultConfig() {
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
    async getStats(pharmacyId) {
        const config = await this.getConfig(pharmacyId);
        const totalClients = await server_1.prisma.clients.count({
            where: { pharmacy_id: pharmacyId }
        });
        const activeClients = await server_1.prisma.clients.count({
            where: {
                pharmacy_id: pharmacyId,
                total_purchases: { gt: 0 }
            }
        });
        const totalPoints = await server_1.prisma.clients.aggregate({
            where: { pharmacy_id: pharmacyId },
            _sum: { loyalty_points: true }
        });
        const recentActivity = await server_1.prisma.loyalty_transactions.count({
            where: {
                client: { pharmacy_id: pharmacyId },
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
exports.LoyaltyConfigService = LoyaltyConfigService;
exports.loyaltyConfigService = new LoyaltyConfigService();

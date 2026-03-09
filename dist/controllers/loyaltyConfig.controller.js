"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyConfigController = exports.LoyaltyConfigController = void 0;
const loyaltyConfig_service_1 = require("../services/loyaltyConfig.service");
class LoyaltyConfigController {
    async getConfig(req, res) {
        try {
            const config = await loyaltyConfig_service_1.loyaltyConfigService.getActiveConfig();
            res.json({ success: true, data: config });
        }
        catch (error) {
            console.error('Error getting config:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateConfig(req, res) {
        try {
            const config = await loyaltyConfig_service_1.loyaltyConfigService.updateConfig(req.body);
            res.json({ success: true, data: config });
        }
        catch (error) {
            console.error('Error updating config:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getStatistics(req, res) {
        try {
            const stats = await loyaltyConfig_service_1.loyaltyConfigService.getPointsStatistics();
            res.json({ success: true, data: stats });
        }
        catch (error) {
            console.error('Error getting statistics:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async simulatePoints(req, res) {
        try {
            const { amount, isFirstPurchase, isBirthday } = req.query;
            const result = loyaltyConfig_service_1.loyaltyConfigService.simulatePoints(parseFloat(amount) || 0, isFirstPurchase === 'true', isBirthday === 'true');
            res.json({ success: true, data: result });
        }
        catch (error) {
            console.error('Error simulating points:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async resetToDefault(req, res) {
        try {
            const config = await loyaltyConfig_service_1.loyaltyConfigService.updateConfig({
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
        }
        catch (error) {
            console.error('Error resetting config:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.LoyaltyConfigController = LoyaltyConfigController;
exports.loyaltyConfigController = new LoyaltyConfigController();

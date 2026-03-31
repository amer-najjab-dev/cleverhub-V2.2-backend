"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyConfigController = exports.LoyaltyConfigController = void 0;
const loyaltyConfig_service_1 = require("../services/loyaltyConfig.service");
class LoyaltyConfigController {
    async getConfig(req, res) {
        try {
            // Obtener pharmacyId del usuario autenticado
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario sin farmacia asignada'
                });
            }
            const config = await loyaltyConfig_service_1.loyaltyConfigService.getConfig(pharmacyId);
            res.json({ success: true, data: config });
        }
        catch (error) {
            console.error('Error getting config:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateConfig(req, res) {
        try {
            // Obtener pharmacyId del usuario autenticado
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario sin farmacia asignada'
                });
            }
            const config = await loyaltyConfig_service_1.loyaltyConfigService.updateConfig(pharmacyId, req.body);
            res.json({ success: true, data: config });
        }
        catch (error) {
            console.error('Error updating config:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getStatistics(req, res) {
        try {
            // Obtener pharmacyId del usuario autenticado
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario sin farmacia asignada'
                });
            }
            const stats = await loyaltyConfig_service_1.loyaltyConfigService.getStats(pharmacyId);
            res.json({ success: true, data: stats });
        }
        catch (error) {
            console.error('Error getting statistics:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async simulatePoints(req, res) {
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
            const config = await loyaltyConfig_service_1.loyaltyConfigService.getConfig(pharmacyId);
            const pointsEarned = Math.floor((parseFloat(amount) || 0) / config.currencyUnit) * config.pointsPerUnit;
            const result = {
                pointsEarned,
                multiplier: 1,
                totalPoints: pointsEarned
            };
            res.json({ success: true, data: result });
        }
        catch (error) {
            console.error('Error simulating points:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async resetToDefault(req, res) {
        try {
            // Obtener pharmacyId del usuario autenticado
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario sin farmacia asignada'
                });
            }
            const config = await loyaltyConfig_service_1.loyaltyConfigService.updateConfig(pharmacyId, {
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
        }
        catch (error) {
            console.error('Error resetting config:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.LoyaltyConfigController = LoyaltyConfigController;
exports.loyaltyConfigController = new LoyaltyConfigController();

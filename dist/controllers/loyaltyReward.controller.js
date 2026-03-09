"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyRewardController = exports.LoyaltyRewardController = void 0;
const loyaltyReward_service_1 = require("../services/loyaltyReward.service");
class LoyaltyRewardController {
    // ========== RECOMPENSAS ==========
    async getAllRewards(req, res) {
        try {
            const { activeOnly } = req.query;
            const rewards = await loyaltyReward_service_1.loyaltyRewardService.getAllRewards(activeOnly !== 'false');
            res.json({ success: true, data: rewards });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async createReward(req, res) {
        try {
            const reward = await loyaltyReward_service_1.loyaltyRewardService.createReward(req.body);
            res.json({ success: true, data: reward });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateReward(req, res) {
        try {
            const { id } = req.params;
            const reward = await loyaltyReward_service_1.loyaltyRewardService.updateReward(parseInt(id), req.body);
            res.json({ success: true, data: reward });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteReward(req, res) {
        try {
            const { id } = req.params;
            await loyaltyReward_service_1.loyaltyRewardService.deleteReward(parseInt(id));
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ========== PACKS ==========
    async getAllPacks(req, res) {
        try {
            const { activeOnly } = req.query;
            const packs = await loyaltyReward_service_1.loyaltyRewardService.getAllPacks(activeOnly !== 'false');
            res.json({ success: true, data: packs });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async createPack(req, res) {
        try {
            const pack = await loyaltyReward_service_1.loyaltyRewardService.createPack(req.body);
            res.json({ success: true, data: pack });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ========== CANJES ==========
    async redeemReward(req, res) {
        try {
            const { clientId, rewardId } = req.params;
            const { saleId } = req.body;
            const result = await loyaltyReward_service_1.loyaltyRewardService.redeemReward(parseInt(clientId), parseInt(rewardId), saleId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async redeemPack(req, res) {
        try {
            const { clientId, packId } = req.params;
            const { saleId } = req.body;
            const result = await loyaltyReward_service_1.loyaltyRewardService.redeemPack(parseInt(clientId), parseInt(packId), saleId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ========== REPORTES ==========
    async getLoyaltyClosure(req, res) {
        try {
            const { date } = req.query;
            const closure = await loyaltyReward_service_1.loyaltyRewardService.getLoyaltyClosure(new Date(date));
            res.json({ success: true, data: closure });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ========== IA STRATEGIST ==========
    async getPromotionSuggestions(req, res) {
        try {
            const suggestions = await loyaltyReward_service_1.loyaltyRewardService.getPromotionSuggestions();
            res.json({ success: true, data: suggestions });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getWeeklyStrategy(req, res) {
        try {
            const strategy = await loyaltyReward_service_1.loyaltyRewardService.getWeeklyStrategy();
            res.json({ success: true, data: strategy });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.LoyaltyRewardController = LoyaltyRewardController;
exports.loyaltyRewardController = new LoyaltyRewardController();

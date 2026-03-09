"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyController = exports.LoyaltyController = void 0;
const loyalty_service_1 = require("../../services/ai/loyalty.service");
class LoyaltyController {
    async getLoyaltySummary(req, res) {
        try {
            console.log('🔵 getLoyaltySummary llamado');
            const summary = await loyalty_service_1.loyaltyService.getLoyaltySummary();
            res.json({
                success: true,
                data: summary
            });
        }
        catch (error) {
            console.error('🔴 Error en getLoyaltySummary:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getClientLoyalty(req, res) {
        try {
            const { clientId } = req.params;
            console.log(`🔵 getClientLoyalty llamado para clientId: ${clientId}`);
            const loyalty = await loyalty_service_1.loyaltyService.calculateClientPoints(parseInt(clientId));
            res.json({
                success: true,
                data: loyalty
            });
        }
        catch (error) {
            console.error('🔴 Error en getClientLoyalty:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getPointsInCirculation(req, res) {
        try {
            console.log('🔵 getPointsInCirculation llamado');
            const points = await loyalty_service_1.loyaltyService.getTotalPointsInCirculation();
            res.json({
                success: true,
                data: points
            });
        }
        catch (error) {
            console.error('🔴 Error en getPointsInCirculation:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getChronicPatients(req, res) {
        try {
            console.log('🔵 getChronicPatients llamado');
            const patients = await loyalty_service_1.loyaltyService.getChronicPatients();
            res.json({
                success: true,
                data: patients
            });
        }
        catch (error) {
            console.error('🔴 Error en getChronicPatients:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getDormantClients(req, res) {
        try {
            const { days } = req.query;
            console.log(`🔵 getDormantClients llamado con days: ${days}`);
            const clients = await loyalty_service_1.loyaltyService.getDormantClients(days ? parseInt(days) : 90);
            res.json({
                success: true,
                data: clients
            });
        }
        catch (error) {
            console.error('🔴 Error en getDormantClients:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getTierAnalysis(req, res) {
        try {
            console.log('🔵 getTierAnalysis llamado');
            const analysis = await loyalty_service_1.loyaltyService.getTierAnalysis();
            res.json({
                success: true,
                data: analysis
            });
        }
        catch (error) {
            console.error('🔴 Error en getTierAnalysis:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getFavoriteCategoriesByTier(req, res) {
        try {
            const { tier } = req.params;
            console.log(`🔵 getFavoriteCategoriesByTier llamado para tier: ${tier}`);
            const categories = await loyalty_service_1.loyaltyService.getFavoriteCategoriesByTier(tier);
            res.json({
                success: true,
                data: categories
            });
        }
        catch (error) {
            console.error('🔴 Error en getFavoriteCategoriesByTier:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.LoyaltyController = LoyaltyController;
exports.loyaltyController = new LoyaltyController();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientIntelligenceController = exports.ClientIntelligenceController = void 0;
const clientIntelligence_service_1 = require("../../services/ai/clientIntelligence.service");
class ClientIntelligenceController {
    async getClientIntelligence(req, res) {
        try {
            console.log('🔵 getClientIntelligence llamado');
            const intelligence = await clientIntelligence_service_1.clientIntelligenceService.getClientIntelligence();
            res.json({
                success: true,
                data: intelligence
            });
        }
        catch (error) {
            console.error('🔴 Error en getClientIntelligence:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getAllRiskScores(req, res) {
        try {
            console.log('🔵 getAllRiskScores llamado');
            const scores = await clientIntelligence_service_1.clientIntelligenceService.calculateAllRiskScores();
            res.json({
                success: true,
                data: scores
            });
        }
        catch (error) {
            console.error('🔴 Error en getAllRiskScores:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getClientRiskScore(req, res) {
        try {
            const { clientId } = req.params;
            console.log(`🔵 getClientRiskScore llamado para clientId: ${clientId}`);
            const score = await clientIntelligence_service_1.clientIntelligenceService.calculateRiskScore(parseInt(clientId));
            res.json({
                success: true,
                data: score
            });
        }
        catch (error) {
            console.error('🔴 Error en getClientRiskScore:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getClientSegments(req, res) {
        try {
            console.log('🔵 getClientSegments llamado');
            const segments = await clientIntelligence_service_1.clientIntelligenceService.getClientSegments();
            res.json({
                success: true,
                data: segments
            });
        }
        catch (error) {
            console.error('🔴 Error en getClientSegments:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getClientPurchaseBehavior(req, res) {
        try {
            const { clientId } = req.params;
            console.log(`🔵 getClientPurchaseBehavior llamado para clientId: ${clientId}`);
            const behavior = await clientIntelligence_service_1.clientIntelligenceService.getPurchaseBehavior(parseInt(clientId));
            res.json({
                success: true,
                data: behavior
            });
        }
        catch (error) {
            console.error('🔴 Error en getClientPurchaseBehavior:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.ClientIntelligenceController = ClientIntelligenceController;
exports.clientIntelligenceController = new ClientIntelligenceController();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignController = exports.CampaignController = void 0;
const data_source_1 = require("../data-source");
const MessageTemplate_1 = require("../entities/MessageTemplate");
const MessageCampaign_1 = require("../entities/MessageCampaign");
const MessageRecipient_1 = require("../entities/MessageRecipient");
const campaignSegmentation_service_1 = require("../services/campaignSegmentation.service");
const whatsapp_service_1 = require("../services/whatsapp.service");
const aiMessageGenerator_service_1 = require("../services/aiMessageGenerator.service");
class CampaignController {
    // ========== PLANTILLAS ==========
    async getTemplates(req, res) {
        try {
            const templateRepo = data_source_1.AppDataSource.getRepository(MessageTemplate_1.MessageTemplate);
            const templates = await templateRepo.find({
                order: { createdAt: 'DESC' }
            });
            res.json({ success: true, data: templates });
        }
        catch (error) {
            console.error('Error getting templates:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async createTemplate(req, res) {
        try {
            const templateRepo = data_source_1.AppDataSource.getRepository(MessageTemplate_1.MessageTemplate);
            const template = templateRepo.create({
                ...req.body,
                createdBy: req.session?.userId
            });
            await templateRepo.save(template);
            res.json({ success: true, data: template });
        }
        catch (error) {
            console.error('Error creating template:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateTemplate(req, res) {
        try {
            const { id } = req.params;
            const templateRepo = data_source_1.AppDataSource.getRepository(MessageTemplate_1.MessageTemplate);
            await templateRepo.update(id, req.body);
            const template = await templateRepo.findOne({ where: { id: parseInt(id) } });
            res.json({ success: true, data: template });
        }
        catch (error) {
            console.error('Error updating template:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteTemplate(req, res) {
        try {
            const { id } = req.params;
            const templateRepo = data_source_1.AppDataSource.getRepository(MessageTemplate_1.MessageTemplate);
            await templateRepo.delete(id);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error deleting template:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ========== CAMPAÑAS ==========
    async getCampaigns(req, res) {
        try {
            const campaignRepo = data_source_1.AppDataSource.getRepository(MessageCampaign_1.MessageCampaign);
            const campaigns = await campaignRepo.find({
                relations: ['template'],
                order: { createdAt: 'DESC' }
            });
            res.json({ success: true, data: campaigns });
        }
        catch (error) {
            console.error('Error getting campaigns:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getCampaign(req, res) {
        try {
            const { id } = req.params;
            const campaignRepo = data_source_1.AppDataSource.getRepository(MessageCampaign_1.MessageCampaign);
            const campaign = await campaignRepo.findOne({
                where: { id: parseInt(id) },
                relations: ['template']
            });
            if (!campaign) {
                return res.status(404).json({ success: false, message: 'Campaign not found' });
            }
            res.json({ success: true, data: campaign });
        }
        catch (error) {
            console.error('Error getting campaign:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async createCampaign(req, res) {
        try {
            const { name, templateId, segments, scheduledFor } = req.body;
            // Contar destinatarios elegibles
            const totalRecipients = await campaignSegmentation_service_1.campaignSegmentationService.countEligibleClients(segments);
            const campaignRepo = data_source_1.AppDataSource.getRepository(MessageCampaign_1.MessageCampaign);
            const campaign = campaignRepo.create({
                name,
                templateId,
                segments,
                scheduledFor,
                totalRecipients,
                createdBy: req.session?.userId,
                status: scheduledFor ? 'scheduled' : 'draft'
            });
            await campaignRepo.save(campaign);
            res.json({ success: true, data: campaign });
        }
        catch (error) {
            console.error('Error creating campaign:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async sendCampaign(req, res) {
        try {
            const { id } = req.params;
            const { delayMs } = req.body;
            const campaignRepo = data_source_1.AppDataSource.getRepository(MessageCampaign_1.MessageCampaign);
            const recipientRepo = data_source_1.AppDataSource.getRepository(MessageRecipient_1.MessageRecipient);
            const campaign = await campaignRepo.findOne({
                where: { id: parseInt(id) },
                relations: ['template']
            });
            if (!campaign) {
                return res.status(404).json({ success: false, message: 'Campaign not found' });
            }
            // Obtener clientes elegibles
            const clients = await campaignSegmentation_service_1.campaignSegmentationService.getEligibleClients(campaign.segments);
            // Crear destinatarios
            const recipients = [];
            for (const client of clients) {
                if (client.phone) {
                    const recipient = recipientRepo.create({
                        clientId: client.id,
                        campaignId: campaign.id,
                        phone: client.phone,
                        status: 'pending'
                    });
                    recipients.push(recipient);
                }
            }
            await recipientRepo.save(recipients);
            // Actualizar total de destinatarios
            await campaignRepo.update(campaign.id, {
                totalRecipients: recipients.length,
                status: 'sending'
            });
            // Iniciar envío progresivo (sin esperar)
            whatsapp_service_1.whatsappService.sendCampaign(campaign.id, delayMs || 5000).catch(console.error);
            res.json({
                success: true,
                message: `Campagne démarrée avec ${recipients.length} destinataires`,
                data: { campaignId: campaign.id, recipientsCount: recipients.length }
            });
        }
        catch (error) {
            console.error('Error sending campaign:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ========== SEGMENTACIÓN ==========
    async previewSegmentation(req, res) {
        try {
            const { segments } = req.body;
            const clients = await campaignSegmentation_service_1.campaignSegmentationService.getEligibleClients(segments);
            res.json({
                success: true,
                data: {
                    count: clients.length,
                    clients: clients.slice(0, 10).map(c => ({
                        id: c.id,
                        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Sans nom',
                        phone: c.phone,
                        points: c.loyaltyPoints
                    }))
                }
            });
        }
        catch (error) {
            console.error('Error previewing segment:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getDormantClients(req, res) {
        try {
            const { days } = req.query;
            const clients = await campaignSegmentation_service_1.campaignSegmentationService.getDormantClients(days ? parseInt(days) : 90);
            res.json({
                success: true,
                data: {
                    count: clients.length,
                    clients: clients.map(c => ({
                        id: c.id,
                        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Sans nom',
                        phone: c.phone,
                        points: c.loyaltyPoints,
                        lastPurchase: c.lastPurchaseDate
                    }))
                }
            });
        }
        catch (error) {
            console.error('Error getting dormant clients:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ========== IA GENERADORA ==========
    async generateAIMessages(req, res) {
        try {
            const { productId, pointsCost } = req.body;
            const messages = await aiMessageGenerator_service_1.aiMessageGeneratorService.generateMessages(productId, pointsCost, req.session?.userId);
            res.json({ success: true, data: messages });
        }
        catch (error) {
            console.error('Error generating AI messages:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async likeAIMessage(req, res) {
        try {
            const { id } = req.params;
            await aiMessageGenerator_service_1.aiMessageGeneratorService.likeMessage(parseInt(id));
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error liking message:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.CampaignController = CampaignController;
exports.campaignController = new CampaignController();

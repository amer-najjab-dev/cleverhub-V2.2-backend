"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = exports.WhatsAppService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const data_source_1 = require("../data-source");
const MessageRecipient_1 = require("../entities/MessageRecipient");
const MessageCampaign_1 = require("../entities/MessageCampaign");
const ClientConsent_1 = require("../entities/ClientConsent");
const Client_1 = require("../entities/Client");
const Sale_1 = require("../entities/Sale");
class WhatsAppService {
    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken || accountSid === 'your_account_sid_here') {
            console.warn('⚠️ Twilio credentials not configured. WhatsApp service will be disabled.');
            this.client = null;
        }
        else {
            this.client = (0, twilio_1.default)(accountSid, authToken);
        }
        this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
        this.statusCallbackUrl = `${process.env.API_URL || 'http://localhost:5001'}/api/whatsapp/status`;
    }
    // Enviar mensaje individual
    async sendMessage(to, message, campaignId, recipientId) {
        try {
            if (!this.client) {
                console.log('📱 WhatsApp service disabled - would send:', { to, message });
                // Simular envío para desarrollo
                if (recipientId) {
                    await data_source_1.AppDataSource.getRepository(MessageRecipient_1.MessageRecipient).update(recipientId, {
                        status: 'sent',
                        sentAt: new Date()
                    });
                }
                return { sid: 'simulated', status: 'sent' };
            }
            // Verificar consentimiento
            const client = await data_source_1.AppDataSource.getRepository(Client_1.Client)
                .findOne({ where: { phone: to.replace('whatsapp:', '') } });
            if (client) {
                const consent = await data_source_1.AppDataSource.getRepository(ClientConsent_1.ClientConsent)
                    .findOne({ where: { clientId: client.id, whatsapp: true } });
                if (!consent) {
                    throw new Error('Client has not consented to WhatsApp messages');
                }
            }
            // Añadir enlace de desuscripción
            const unsubscribeLink = client ?
                `https://cleverhub.ma/unsubscribe/${client.id}` : '';
            const fullMessage = `${message}\n\nPour vous désabonner: ${unsubscribeLink}`;
            const result = await this.client.messages.create({
                from: this.fromNumber,
                to: `whatsapp:${to}`,
                body: fullMessage,
                statusCallback: this.statusCallbackUrl
            });
            // Actualizar estado del destinatario
            if (recipientId) {
                await data_source_1.AppDataSource.getRepository(MessageRecipient_1.MessageRecipient).update(recipientId, {
                    status: 'sent',
                    sentAt: new Date()
                });
            }
            return result;
        }
        catch (error) {
            console.error('Error sending WhatsApp message:', error);
            if (recipientId) {
                await data_source_1.AppDataSource.getRepository(MessageRecipient_1.MessageRecipient).update(recipientId, {
                    status: 'failed'
                });
            }
            throw error;
        }
    }
    // Envío progresivo (anti-spam)
    async sendCampaign(campaignId, delayMs = 5000) {
        const campaignRepo = data_source_1.AppDataSource.getRepository(MessageCampaign_1.MessageCampaign);
        const recipientRepo = data_source_1.AppDataSource.getRepository(MessageRecipient_1.MessageRecipient);
        const campaign = await campaignRepo.findOne({
            where: { id: campaignId },
            relations: ['template']
        });
        if (!campaign)
            throw new Error('Campaign not found');
        await campaignRepo.update(campaignId, { status: 'sending' });
        const recipients = await recipientRepo.find({
            where: { campaignId, status: 'pending' },
            relations: ['client']
        });
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            // Personalizar mensaje
            const message = this.personalizeMessage(campaign.template.content, recipient);
            try {
                await this.sendMessage(recipient.phone, message, campaignId, recipient.id);
                // Esperar entre mensajes para evitar spam
                if (i < recipients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
            catch (error) {
                console.error(`Failed to send to ${recipient.phone}:`, error);
            }
        }
        await campaignRepo.update(campaignId, {
            status: 'completed',
            completedAt: new Date()
        });
    }
    // Personalizar mensaje con variables
    personalizeMessage(template, recipient) {
        let message = template;
        // Reemplazar variables comunes
        const variables = {
            '{{nombre_cliente}}': recipient.client?.firstName || 'client',
            '{{puntos_actuales}}': recipient.client?.loyaltyPoints?.toString() || '0',
            '{{enlace_desinscripcion}}': `https://cleverhub.ma/unsubscribe/${recipient.clientId}`
        };
        for (const [key, value] of Object.entries(variables)) {
            message = message.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        }
        return message;
    }
    // Webhook para actualizar estado de mensajes
    async handleStatusUpdate(payload) {
        const { MessageSid, MessageStatus, To } = payload;
        const recipient = await data_source_1.AppDataSource.getRepository(MessageRecipient_1.MessageRecipient)
            .findOne({ where: { phone: To.replace('whatsapp:', '') } });
        if (!recipient)
            return;
        let updateData = {};
        switch (MessageStatus) {
            case 'delivered':
                updateData = { status: 'delivered', deliveredAt: new Date() };
                break;
            case 'read':
                updateData = { status: 'read', readAt: new Date() };
                break;
            case 'failed':
                updateData = { status: 'failed' };
                break;
        }
        await data_source_1.AppDataSource.getRepository(MessageRecipient_1.MessageRecipient).update(recipient.id, updateData);
        // Actualizar estadísticas de campaña
        if (recipient.campaignId) {
            const campaignRepo = data_source_1.AppDataSource.getRepository(MessageCampaign_1.MessageCampaign);
            if (MessageStatus === 'delivered') {
                await campaignRepo.increment({ id: recipient.campaignId }, 'deliveredCount', 1);
            }
            else if (MessageStatus === 'read') {
                await campaignRepo.increment({ id: recipient.campaignId }, 'readCount', 1);
            }
        }
    }
    // Registrar conversión (compra después de mensaje)
    async trackConversion(clientId, saleId) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recipient = await data_source_1.AppDataSource.getRepository(MessageRecipient_1.MessageRecipient)
            .createQueryBuilder('r')
            .where('r.clientId = :clientId', { clientId })
            .andWhere('r.sentAt >= :sevenDaysAgo', { sevenDaysAgo })
            .andWhere('r.status IN (:...statuses)', { statuses: ['delivered', 'read'] })
            .orderBy('r.sentAt', 'DESC')
            .getOne();
        if (recipient) {
            await data_source_1.AppDataSource.getRepository(MessageRecipient_1.MessageRecipient).update(recipient.id, {
                convertedAt: new Date(),
                conversionSaleId: saleId
            });
            // Actualizar estadísticas de campaña
            if (recipient.campaignId) {
                const sale = await data_source_1.AppDataSource.getRepository(Sale_1.Sale)
                    .findOne({ where: { id: saleId } });
                await data_source_1.AppDataSource.getRepository(MessageCampaign_1.MessageCampaign)
                    .increment({ id: recipient.campaignId }, 'conversionCount', 1);
                if (sale) {
                    await data_source_1.AppDataSource.getRepository(MessageCampaign_1.MessageCampaign)
                        .increment({ id: recipient.campaignId }, 'conversionValue', sale.total);
                }
            }
        }
    }
}
exports.WhatsAppService = WhatsAppService;
exports.whatsappService = new WhatsAppService();

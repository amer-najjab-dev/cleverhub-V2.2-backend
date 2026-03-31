"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignController = exports.CampaignController = void 0;
const server_1 = require("../server");
const campaignSegmentation_service_1 = require("../services/campaignSegmentation.service");
const whatsapp_service_1 = require("../services/whatsapp.service");
class CampaignController {
    // ========== PLANTILLAS ==========
    async getTemplates(req, res) {
        try {
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const templates = await server_1.prisma.message_templates.findMany({
                where: {
                    status: 'active',
                    pharmacy_id: pharmacyId,
                },
                orderBy: {
                    created_at: 'desc',
                },
            });
            res.json({ success: true, data: templates });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async createTemplate(req, res) {
        try {
            const { name, content, variables, category } = req.body;
            const userId = req.user?.id;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const template = await server_1.prisma.message_templates.create({
                data: {
                    name,
                    content,
                    variables: variables || {},
                    category,
                    status: 'active',
                    created_by: userId,
                    pharmacy_id: pharmacyId,
                },
            });
            res.status(201).json({ success: true, data: template });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateTemplate(req, res) {
        try {
            const { id } = req.params;
            const { name, content, variables, category, status } = req.body;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            // Verificar que la plantilla pertenece a la farmacia
            const existingTemplate = await server_1.prisma.message_templates.findFirst({
                where: {
                    id: parseInt(id),
                    pharmacy_id: pharmacyId,
                },
            });
            if (!existingTemplate) {
                return res.status(404).json({ success: false, message: 'Plantilla no encontrada' });
            }
            const template = await server_1.prisma.message_templates.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    content,
                    variables: variables || undefined,
                    category,
                    status,
                },
            });
            res.json({ success: true, data: template });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteTemplate(req, res) {
        try {
            const { id } = req.params;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            // Verificar que la plantilla pertenece a la farmacia
            const template = await server_1.prisma.message_templates.findFirst({
                where: {
                    id: parseInt(id),
                    pharmacy_id: pharmacyId,
                },
            });
            if (!template) {
                return res.status(404).json({ success: false, message: 'Plantilla no encontrada' });
            }
            // Soft delete: cambiar estado a inactive
            await server_1.prisma.message_templates.update({
                where: { id: parseInt(id) },
                data: { status: 'inactive' },
            });
            res.json({ success: true, message: 'Plantilla eliminada correctamente' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ========== CAMPAÑAS ==========
    async getCampaigns(req, res) {
        try {
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const campaigns = await server_1.prisma.message_campaigns.findMany({
                where: {
                    pharmacy_id: pharmacyId,
                },
                include: {
                    template: true,
                    _count: {
                        select: { recipients: true }
                    }
                },
                orderBy: {
                    created_at: 'desc',
                },
            });
            res.json({ success: true, data: campaigns });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async createCampaign(req, res) {
        try {
            const { name, templateId, segments, scheduledFor } = req.body;
            const userId = req.user?.id;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            // Verificar que la plantilla existe y pertenece a la farmacia
            if (templateId) {
                const template = await server_1.prisma.message_templates.findFirst({
                    where: {
                        id: templateId,
                        pharmacy_id: pharmacyId,
                    },
                });
                if (!template) {
                    return res.status(404).json({ success: false, message: 'Plantilla no encontrada' });
                }
            }
            // Obtener destinatarios basados en segmentos
            const recipients = await campaignSegmentation_service_1.campaignSegmentationService.getClientsBySegments(segments);
            const campaign = await server_1.prisma.message_campaigns.create({
                data: {
                    name,
                    template_id: templateId || null,
                    segments,
                    total_recipients: recipients.length,
                    status: scheduledFor ? 'scheduled' : 'draft',
                    scheduled_for: scheduledFor ? new Date(scheduledFor) : null,
                    created_by: userId,
                    pharmacy_id: pharmacyId,
                },
            });
            // Crear registros de destinatarios
            for (const recipient of recipients) {
                await server_1.prisma.message_recipients.create({
                    data: {
                        client_id: recipient.client_id,
                        campaign_id: campaign.id,
                        phone: recipient.phone,
                        status: 'pending',
                    },
                });
            }
            res.status(201).json({ success: true, data: campaign });
        }
        catch (error) {
            console.error('Error creating campaign:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async sendCampaign(req, res) {
        try {
            const { id } = req.params;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const campaign = await server_1.prisma.message_campaigns.findFirst({
                where: {
                    id: parseInt(id),
                    pharmacy_id: pharmacyId,
                },
                include: {
                    template: true,
                    recipients: {
                        where: { status: 'pending' }
                    }
                },
            });
            if (!campaign) {
                return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
            }
            // Validar que la plantilla existe
            if (!campaign.template) {
                return res.status(400).json({
                    success: false,
                    message: 'La campaña no tiene una plantilla asociada. Por favor, asigna una plantilla antes de enviar.'
                });
            }
            // Validar que el contenido de la plantilla no esté vacío
            if (!campaign.template.content || campaign.template.content.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'La plantilla asociada no tiene contenido. Por favor, edita la plantilla.'
                });
            }
            // Validar que hay destinatarios pendientes
            if (!campaign.recipients || campaign.recipients.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay destinatarios pendientes para esta campaña.'
                });
            }
            let sentCount = 0;
            let failedCount = 0;
            // Enviar mensajes
            for (const recipient of campaign.recipients) {
                try {
                    // Reemplazar variables en el contenido si es necesario
                    let messageContent = campaign.template.content;
                    // Si hay variables definidas en la plantilla, reemplazar con datos del cliente
                    if (campaign.template.variables && recipient.client_id) {
                        const client = await server_1.prisma.clients.findUnique({
                            where: { id: recipient.client_id },
                            select: { first_name: true, last_name: true }
                        });
                        if (client) {
                            messageContent = messageContent
                                .replace(/{{nombre}}/g, client.first_name)
                                .replace(/{{apellido}}/g, client.last_name)
                                .replace(/{{nombre_completo}}/g, `${client.first_name} ${client.last_name}`);
                        }
                    }
                    if (!recipient.phone) {
                        console.log(`⚠️ Destinatario ${recipient.id} no tiene teléfono, omitiendo`);
                        continue;
                    }
                    await whatsapp_service_1.whatsappService.sendMessage({
                        to: recipient.phone, // Ahora TypeScript sabe que no es null
                        body: messageContent
                    });
                    // Opción 2: Si sendMessage espera solo content (usar para broadcast)
                    // await whatsappService.sendMessage(messageContent);
                    // Actualizar estado del destinatario
                    await server_1.prisma.message_recipients.update({
                        where: { id: recipient.id },
                        data: {
                            status: 'sent',
                            sent_at: new Date(),
                            message: messageContent
                        }
                    });
                    sentCount++;
                    // Pequeña pausa para evitar rate limiting (opcional)
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                catch (error) {
                    console.error(`Error sending to ${recipient.phone}:`, error);
                    failedCount++;
                    await server_1.prisma.message_recipients.update({
                        where: { id: recipient.id },
                        data: { status: 'failed' }
                    });
                }
            }
            // Actualizar la campaña
            const updatedCampaign = await server_1.prisma.message_campaigns.update({
                where: { id: parseInt(id) },
                data: {
                    status: 'sent',
                    sent_at: new Date(),
                    sent_count: sentCount
                }
            });
            res.json({
                success: true,
                message: 'Campaña enviada',
                data: {
                    total: campaign.recipients.length,
                    sent: sentCount,
                    failed: failedCount
                }
            });
        }
        catch (error) {
            console.error('Error sending campaign:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getCampaignStats(req, res) {
        try {
            const { id } = req.params;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const campaign = await server_1.prisma.message_campaigns.findFirst({
                where: {
                    id: parseInt(id),
                    pharmacy_id: pharmacyId,
                },
                include: {
                    recipients: true,
                    template: true
                }
            });
            if (!campaign) {
                return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
            }
            const stats = {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                total: campaign.recipients.length,
                sent: campaign.recipients.filter(r => r.status === 'sent').length,
                delivered: campaign.recipients.filter(r => r.delivered_at).length,
                read: campaign.recipients.filter(r => r.read_at).length,
                converted: campaign.recipients.filter(r => r.converted_at).length,
                pending: campaign.recipients.filter(r => r.status === 'pending').length,
                failed: campaign.recipients.filter(r => r.status === 'failed').length,
                conversionValue: campaign.conversion_value || 0,
                sentAt: campaign.sent_at,
                scheduledFor: campaign.scheduled_for,
            };
            res.json({ success: true, data: stats });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getCampaignRecipients(req, res) {
        try {
            const { id } = req.params;
            const pharmacyId = req.user?.pharmacyId;
            const { status, limit = 100, offset = 0 } = req.query;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            // Verificar que la campaña pertenece a la farmacia
            const campaign = await server_1.prisma.message_campaigns.findFirst({
                where: {
                    id: parseInt(id),
                    pharmacy_id: pharmacyId,
                },
            });
            if (!campaign) {
                return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
            }
            const where = { campaign_id: parseInt(id) };
            if (status) {
                where.status = status;
            }
            const recipients = await server_1.prisma.message_recipients.findMany({
                where,
                include: {
                    client: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                take: Number(limit),
                skip: Number(offset),
            });
            const total = await server_1.prisma.message_recipients.count({ where });
            res.json({
                success: true,
                data: recipients,
                meta: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset),
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteCampaign(req, res) {
        try {
            const { id } = req.params;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            // Verificar que la campaña pertenece a la farmacia
            const campaign = await server_1.prisma.message_campaigns.findFirst({
                where: {
                    id: parseInt(id),
                    pharmacy_id: pharmacyId,
                },
            });
            if (!campaign) {
                return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
            }
            // No permitir eliminar campañas enviadas
            if (campaign.status === 'sent') {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar una campaña que ya ha sido enviada'
                });
            }
            await server_1.prisma.message_campaigns.delete({
                where: { id: parseInt(id) },
            });
            res.json({ success: true, message: 'Campaña eliminada correctamente' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.CampaignController = CampaignController;
exports.campaignController = new CampaignController();

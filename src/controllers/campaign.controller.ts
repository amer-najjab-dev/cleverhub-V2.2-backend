import { Request, Response } from 'express';
import { prisma } from '../server';
import { campaignSegmentationService } from '../services/campaignSegmentation.service';
import { aiMessageGeneratorService } from '../services/aiMessageGenerator.service';
import { whatsappService } from '../services/whatsapp.service';

export class CampaignController {
  
  // ========== PLANTILLAS ==========
  
  async getTemplates(req: Request, res: Response) {
    try {
      const templates = await prisma.message_templates.findMany({
        where: {
          status: 'active',
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      res.json({
        success: true,
        data: templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          content: t.content,
          variables: t.variables,
          category: t.category,
          createdAt: t.created_at,
        })),
      });
    } catch (error: any) {
      console.error('Error getting templates:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createTemplate(req: Request, res: Response) {
    try {
      const { name, content, variables, category } = req.body;
      const userId = (req as any).session?.userId;

      const template = await prisma.message_templates.create({
        data: {
          name,
          content,
          variables: variables || {},
          category,
          status: 'active',
          created_by: userId,
        },
      });

      res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ========== CAMPAÑAS ==========

  async getCampaigns(req: Request, res: Response) {
    try {
      const campaigns = await prisma.message_campaigns.findMany({
        include: {
          template: true,
          _count: {
            select: { recipients: true },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      res.json({
        success: true,
        data: campaigns.map((c: any) => ({
          id: c.id,
          name: c.name,
          templateName: c.template?.name,
          segments: c.segments,
          totalRecipients: c.total_recipients,
          status: c.status,
          scheduledFor: c.scheduled_for,
          sentAt: c.sent_at,
          stats: {
            sent: c.sent_count || 0,
            delivered: c.delivered_count || 0,
            read: c.read_count || 0,
            converted: c.conversion_count || 0,
          },
          createdAt: c.created_at,
        })),
      });
    } catch (error: any) {
      console.error('Error getting campaigns:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createCampaign(req: Request, res: Response) {
    try {
      const { name, templateId, segments, scheduledFor } = req.body;
      const userId = (req as any).session?.userId;

      // Obtener clientes según segmentos
      const recipients = await campaignSegmentationService.getClientsBySegments(segments);
      
      // Generar mensajes personalizados
      const template = await prisma.message_templates.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template non trouvé',
        });
      }

      const campaign = await prisma.message_campaigns.create({
        data: {
          name,
          template_id: templateId,
          segments,
          total_recipients: recipients.length,
          status: scheduledFor ? 'scheduled' : 'draft',
          scheduled_for: scheduledFor ? new Date(scheduledFor) : null,
          created_by: userId,
        },
      });

      // Crear recipients
      for (const recipient of recipients) {
        const personalizedMessage = aiMessageGeneratorService.personalizeMessage(
          template.content,
          recipient,
          (template.variables as Record<string, string>) || {}
        );

        await prisma.message_recipients.create({
          data: {
            campaign_id: campaign.id,
            client_id: recipient.id,
            phone: recipient.phone,
            message: personalizedMessage,
            status: 'pending',
          },
        });
      }

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async sendCampaign(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const campaign = await prisma.message_campaigns.findUnique({
        where: { id: parseInt(id) },
        include: {
          recipients: true,
        },
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campagne non trouvée',
        });
      }

      // Enviar mensajes
      const results = await whatsappService.sendBulkMessages(
        campaign.recipients.map((r: any) => ({
          to: r.phone,
          body: r.message,
        }))
      );

      // Actualizar estado
      await prisma.message_campaigns.update({
        where: { id: campaign.id },
        data: {
          status: 'sent',
          sent_at: new Date(),
          sent_count: results.filter((r: any) => r.success).length,
        },
      });

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ========== ESTADÍSTICAS ==========

  async getCampaignStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const campaign = await prisma.message_campaigns.findUnique({
        where: { id: parseInt(id) },
        include: {
          recipients: true,
        },
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campagne non trouvée',
        });
      }

      const stats = {
        total: campaign.total_recipients || 0,
        sent: campaign.sent_count || 0,
        delivered: campaign.delivered_count || 0,
        read: campaign.read_count || 0,
        converted: campaign.conversion_count || 0,
        conversionValue: campaign.conversion_value || 0,
        rates: {
          delivery: campaign.sent_count ? 
            ((campaign.delivered_count || 0) / campaign.sent_count) * 100 : 0,
          read: campaign.delivered_count ? 
            ((campaign.read_count || 0) / campaign.delivered_count) * 100 : 0,
          conversion: campaign.sent_count ? 
            ((campaign.conversion_count || 0) / campaign.sent_count) * 100 : 0,
        },
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error getting campaign stats:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export const campaignController = new CampaignController();

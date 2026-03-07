// backend/src/controllers/campaign.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { MessageTemplate } from '../entities/MessageTemplate';
import { MessageCampaign } from '../entities/MessageCampaign';
import { MessageRecipient } from '../entities/MessageRecipient';
import { ClientConsent } from '../entities/ClientConsent';
import { campaignSegmentationService } from '../services/campaignSegmentation.service';
import { whatsappService } from '../services/whatsapp.service';
import { aiMessageGeneratorService } from '../services/aiMessageGenerator.service';

export class CampaignController {
  
  // ========== PLANTILLAS ==========
  
  async getTemplates(req: Request, res: Response) {
    try {
      const templateRepo = AppDataSource.getRepository(MessageTemplate);
      const templates = await templateRepo.find({
        order: { createdAt: 'DESC' }
      });
      res.json({ success: true, data: templates });
    } catch (error: any) {
      console.error('Error getting templates:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createTemplate(req: Request, res: Response) {
    try {
      const templateRepo = AppDataSource.getRepository(MessageTemplate);
      const template = templateRepo.create({
        ...req.body,
        createdBy: req.session?.userId
      });
      await templateRepo.save(template);
      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('Error creating template:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const templateRepo = AppDataSource.getRepository(MessageTemplate);
      await templateRepo.update(id, req.body);
      const template = await templateRepo.findOne({ where: { id: parseInt(id) } });
      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('Error updating template:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const templateRepo = AppDataSource.getRepository(MessageTemplate);
      await templateRepo.delete(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========== CAMPAÑAS ==========

  async getCampaigns(req: Request, res: Response) {
    try {
      const campaignRepo = AppDataSource.getRepository(MessageCampaign);
      const campaigns = await campaignRepo.find({
        relations: ['template'],
        order: { createdAt: 'DESC' }
      });
      res.json({ success: true, data: campaigns });
    } catch (error: any) {
      console.error('Error getting campaigns:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCampaign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const campaignRepo = AppDataSource.getRepository(MessageCampaign);
      const campaign = await campaignRepo.findOne({
        where: { id: parseInt(id) },
        relations: ['template']
      });
      
      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }
      
      res.json({ success: true, data: campaign });
    } catch (error: any) {
      console.error('Error getting campaign:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createCampaign(req: Request, res: Response) {
    try {
      const { name, templateId, segments, scheduledFor } = req.body;
      
      // Contar destinatarios elegibles
      const totalRecipients = await campaignSegmentationService.countEligibleClients(segments);
      
      const campaignRepo = AppDataSource.getRepository(MessageCampaign);
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
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async sendCampaign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { delayMs } = req.body;
      
      const campaignRepo = AppDataSource.getRepository(MessageCampaign);
      const recipientRepo = AppDataSource.getRepository(MessageRecipient);
      
      const campaign = await campaignRepo.findOne({ 
        where: { id: parseInt(id) },
        relations: ['template']
      });
      
      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }

      // Obtener clientes elegibles
      const clients = await campaignSegmentationService.getEligibleClients(campaign.segments);
      
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
      whatsappService.sendCampaign(campaign.id, delayMs || 5000).catch(console.error);
      
      res.json({ 
        success: true, 
        message: `Campagne démarrée avec ${recipients.length} destinataires`,
        data: { campaignId: campaign.id, recipientsCount: recipients.length }
      });
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========== SEGMENTACIÓN ==========

  async previewSegmentation(req: Request, res: Response) {
    try {
      const { segments } = req.body;
      const clients = await campaignSegmentationService.getEligibleClients(segments);
      
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
    } catch (error: any) {
      console.error('Error previewing segment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDormantClients(req: Request, res: Response) {
    try {
      const { days } = req.query;
      const clients = await campaignSegmentationService.getDormantClients(
        days ? parseInt(days as string) : 90
      );
      
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
    } catch (error: any) {
      console.error('Error getting dormant clients:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========== IA GENERADORA ==========

  async generateAIMessages(req: Request, res: Response) {
    try {
      const { productId, pointsCost } = req.body;
      const messages = await aiMessageGeneratorService.generateMessages(
        productId,
        pointsCost,
        req.session?.userId
      );
      
      res.json({ success: true, data: messages });
    } catch (error: any) {
      console.error('Error generating AI messages:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async likeAIMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await aiMessageGeneratorService.likeMessage(parseInt(id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error liking message:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const campaignController = new CampaignController();
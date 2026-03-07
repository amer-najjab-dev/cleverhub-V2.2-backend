import twilio from 'twilio';
import { AppDataSource } from '../data-source';
import { MessageRecipient } from '../entities/MessageRecipient';
import { MessageCampaign } from '../entities/MessageCampaign';
import { ClientConsent } from '../entities/ClientConsent';
import { Client } from '../entities/Client';
import { Sale } from '../entities/Sale';

export class WhatsAppService {
  private client: any; // Usar any para evitar problemas de tipos
  private readonly fromNumber: string;
  private readonly statusCallbackUrl: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken || accountSid === 'your_account_sid_here') {
      console.warn('⚠️ Twilio credentials not configured. WhatsApp service will be disabled.');
      this.client = null;
    } else {
      this.client = twilio(accountSid, authToken);
    }
    
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    this.statusCallbackUrl = `${process.env.API_URL || 'http://localhost:5001'}/api/whatsapp/status`;
  }

  // Enviar mensaje individual
  async sendMessage(
    to: string, 
    message: string, 
    campaignId?: number, 
    recipientId?: number
  ): Promise<any> {
    try {
      if (!this.client) {
        console.log('📱 WhatsApp service disabled - would send:', { to, message });
        // Simular envío para desarrollo
        if (recipientId) {
          await AppDataSource.getRepository(MessageRecipient).update(recipientId, {
            status: 'sent',
            sentAt: new Date()
          });
        }
        return { sid: 'simulated', status: 'sent' };
      }

      // Verificar consentimiento
      const client = await AppDataSource.getRepository(Client)
        .findOne({ where: { phone: to.replace('whatsapp:', '') } });
      
      if (client) {
        const consent = await AppDataSource.getRepository(ClientConsent)
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
        await AppDataSource.getRepository(MessageRecipient).update(recipientId, {
          status: 'sent',
          sentAt: new Date()
        });
      }

      return result;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      if (recipientId) {
        await AppDataSource.getRepository(MessageRecipient).update(recipientId, {
          status: 'failed'
        });
      }
      throw error;
    }
  }

  // Envío progresivo (anti-spam)
  async sendCampaign(campaignId: number, delayMs: number = 5000): Promise<void> {
    const campaignRepo = AppDataSource.getRepository(MessageCampaign);
    const recipientRepo = AppDataSource.getRepository(MessageRecipient);
    
    const campaign = await campaignRepo.findOne({ 
      where: { id: campaignId },
      relations: ['template']
    });
    
    if (!campaign) throw new Error('Campaign not found');

    await campaignRepo.update(campaignId, { status: 'sending' });

    const recipients = await recipientRepo.find({
      where: { campaignId, status: 'pending' },
      relations: ['client']
    });

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // Personalizar mensaje
      const message = this.personalizeMessage(
        campaign.template.content,
        recipient
      );

      try {
        await this.sendMessage(
          recipient.phone,
          message,
          campaignId,
          recipient.id
        );

        // Esperar entre mensajes para evitar spam
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.error(`Failed to send to ${recipient.phone}:`, error);
      }
    }

    await campaignRepo.update(campaignId, { 
      status: 'completed',
      completedAt: new Date()
    });
  }

  // Personalizar mensaje con variables
  personalizeMessage(template: string, recipient: MessageRecipient): string {
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
  async handleStatusUpdate(payload: any): Promise<void> {
    const { MessageSid, MessageStatus, To } = payload;
    
    const recipient = await AppDataSource.getRepository(MessageRecipient)
      .findOne({ where: { phone: To.replace('whatsapp:', '') } });

    if (!recipient) return;

    let updateData: any = {};

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

    await AppDataSource.getRepository(MessageRecipient).update(recipient.id, updateData);

    // Actualizar estadísticas de campaña
    if (recipient.campaignId) {
      const campaignRepo = AppDataSource.getRepository(MessageCampaign);
      
      if (MessageStatus === 'delivered') {
        await campaignRepo.increment({ id: recipient.campaignId }, 'deliveredCount', 1);
      } else if (MessageStatus === 'read') {
        await campaignRepo.increment({ id: recipient.campaignId }, 'readCount', 1);
      }
    }
  }

  // Registrar conversión (compra después de mensaje)
  async trackConversion(clientId: number, saleId: number): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recipient = await AppDataSource.getRepository(MessageRecipient)
      .createQueryBuilder('r')
      .where('r.clientId = :clientId', { clientId })
      .andWhere('r.sentAt >= :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('r.status IN (:...statuses)', { statuses: ['delivered', 'read'] })
      .orderBy('r.sentAt', 'DESC')
      .getOne();

    if (recipient) {
      await AppDataSource.getRepository(MessageRecipient).update(recipient.id, {
        convertedAt: new Date(),
        conversionSaleId: saleId
      });

      // Actualizar estadísticas de campaña
      if (recipient.campaignId) {
        const sale = await AppDataSource.getRepository(Sale)
          .findOne({ where: { id: saleId } });
        
        await AppDataSource.getRepository(MessageCampaign)
          .increment({ id: recipient.campaignId }, 'conversionCount', 1);
        
        if (sale) {
          await AppDataSource.getRepository(MessageCampaign)
            .increment({ id: recipient.campaignId }, 'conversionValue', sale.total);
        }
      }
    }
  }
}

export const whatsappService = new WhatsAppService();
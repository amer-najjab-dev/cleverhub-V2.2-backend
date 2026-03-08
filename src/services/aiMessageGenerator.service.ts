// backend/src/services/aiMessageGenerator.service.ts
import { AppDataSource } from '../data-source';
import { Product } from '../entities/Product';
import { AIGeneratedMessage } from '../entities/AIGeneratedMessage';
import { User } from '../entities/User';

export class AIMessageGeneratorService {
  private messageRepo = AppDataSource.getRepository(AIGeneratedMessage);

  // Simular IA (en producción usarías OpenAI o similar)
  async generateMessages(
    productId: number, 
    pointsCost?: number,
    userId?: number
  ): Promise<Array<{ tone: string; message: string }>> {
    const product = await AppDataSource.getRepository(Product)
      .findOne({ where: { id: productId } });

    if (!product) throw new Error('Product not found');

    const messages = [];

    // Mensaje profesional
    messages.push({
      tone: 'professional',
      message: this.generateProfessionalMessage(product, pointsCost)
    });

    // Mensaje cercano/amigable
    messages.push({
      tone: 'friendly',
      message: this.generateFriendlyMessage(product, pointsCost)
    });

    // Mensaje de urgencia
    if (product.expirationDate) {
      const daysToExpiry = Math.ceil(
        (product.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      messages.push({
        tone: 'urgent',
        message: this.generateUrgentMessage(product, daysToExpiry, pointsCost)
      });
    }

    // Guardar mensajes generados
    for (const msg of messages) {
      const aiMessage = new AIGeneratedMessage();
      aiMessage.tone = msg.tone;
      aiMessage.message = msg.message;
      aiMessage.productId = productId;
      // ✅ CORREGIDO: Ahora acepta number | null | undefined
      aiMessage.pointsCost = pointsCost ?? null;
      aiMessage.createdBy = userId ?? null;
      aiMessage.usageCount = 0;
      aiMessage.likeCount = 0;
      
      await this.messageRepo.save(aiMessage);
    }

    return messages;
  }

  private generateProfessionalMessage(product: Product, pointsCost?: number): string {
    const pointsText = pointsCost ? 
      ` par ${pointsCost} points` : 
      ' à un prix spécial';

    return `Bonjour {{nombre_cliente}}, nous avons le plaisir de vous informer que ${product.name} est disponible${pointsText}. Profitez-en dès maintenant dans votre pharmacie CleverHub.`;
  }

  private generateFriendlyMessage(product: Product, pointsCost?: number): string {
    const pointsText = pointsCost ? 
      ` à seulement ${pointsCost} points` : 
      ' en promotion';

    return `Salut {{nombre_cliente}} 👋, on a pensé à toi ! ${product.name} est disponible${pointsText}. Viens vite le découvrir ! 🎁`;
  }

  private generateUrgentMessage(product: Product, daysToExpiry: number, pointsCost?: number): string {
    const pointsText = pointsCost ? 
      ` à ${pointsCost} points` : 
      '';
    
    return `⚠️ URGENT - DERNIÈRE CHANCE ⚠️\n\n{{nombre_cliente}}, il ne reste que ${daysToExpiry} jours avant l'expiration de ${product.name}${pointsText}. Ne ratez pas cette occasion unique !`;
  }

  // Obtener mensajes generados anteriormente
  async getRecentMessages(productId: number, limit: number = 5): Promise<AIGeneratedMessage[]> {
    return this.messageRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['createdByUser']
    });
  }

  // Registrar uso de mensaje
  async recordUsage(messageId: number): Promise<void> {
    await this.messageRepo.increment({ id: messageId }, 'usageCount', 1);
  }

  // Registrar like en mensaje
  async likeMessage(messageId: number): Promise<void> {
    await this.messageRepo.increment({ id: messageId }, 'likeCount', 1);
  }
}

export const aiMessageGeneratorService = new AIMessageGeneratorService();
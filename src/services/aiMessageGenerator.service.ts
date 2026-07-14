import { prisma } from '../server';

export interface MessageOptions {
  tone?: 'profesional' | 'amigable' | 'entusiasta' | 'urgente';
  includeProductInfo?: boolean;
  maxLength?: number;
}

export class AIMessageGeneratorService {
  
  async generateMessage(
    productId: number,
    options: MessageOptions = {}
  ): Promise<string> {
    const product = await prisma.products.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    const tone = options.tone || 'profesional';
    const includeProductInfo = options.includeProductInfo ?? true;
    
    let message = '';

    switch (tone) {
      case 'profesional':
        message = this.generateProfessionalMessage(product);
        break;
      case 'amigable':
        message = this.generateFriendlyMessage(product);
        break;
      case 'entusiasta':
        message = this.generateEnthusiasticMessage(product);
        break;
      case 'urgente':
        message = this.generateUrgentMessage(product);
        break;
    }

    if (includeProductInfo) {
      message += `\n\n${product.name} - ${product.pricePPV} MAD`;
    }

    // Guardar mensaje generado
    await this.saveGeneratedMessage(productId, message, tone);

    return message;
  }

  async generateBulkMessages(
    productIds: number[],
    options: MessageOptions = {}
  ): Promise<Array<{ productId: number; message: string }>> {
    const messages = [];

    for (const productId of productIds) {
      try {
        const message = await this.generateMessage(productId, options);
        messages.push({ productId, message });
      } catch (error) {
        console.error(`Error generando mensaje para producto ${productId}:`, error);
      }
    }

    return messages;
  }

  personalizeMessage(
    template: string,
    client: any,
    variables: Record<string, string>
  ): string {
    let personalized = template;

    // Variables predefinidas
    personalized = personalized.replace(/{{nombre}}/g, client.firstName || 'cliente');
    personalized = personalized.replace(/{{apellido}}/g, client.lastName || '');
    personalized = personalized.replace(/{{nombre_completo}}/g, client.name || 'cliente');
    
    if (client.loyaltyPoints) {
      personalized = personalized.replace(/{{puntos}}/g, client.loyaltyPoints.toString());
    }

    if (client.totalSpent) {
      personalized = personalized.replace(/{{gasto_total}}/g, client.totalSpent.toString());
    }

    // Variables personalizadas
    Object.entries(variables).forEach(([key, value]) => {
      personalized = personalized.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return personalized;
  }

  async saveGeneratedMessage(
    productId: number,
    message: string,
    tone: string,
    userId?: number
  ): Promise<void> {
    await prisma.ai_generated_messages.create({
      data: {
        product_id: productId,
        message,
        tone,
        created_by: userId,
      },
    });
  }

  async likeMessage(messageId: number): Promise<void> {
    await prisma.ai_generated_messages.update({
      where: { id: messageId },
      data: {
        like_count: {
          increment: 1,
        },
      },
    });
  }

  async getPopularMessages(limit: number = 10): Promise<any[]> {
    const messages = await prisma.ai_generated_messages.findMany({
      where: {
        like_count: {
          gt: 0,
        },
      },
      include: {
        products: true,
      },
      orderBy: {
        like_count: 'desc',
      },
      take: limit,
    });

    return messages.map((m: any) => ({
      id: m.id,
      message: m.message,
      tone: m.tone,
      likes: m.like_count,
      usageCount: m.usage_count,
      productName: m.product?.name,
      createdAt: m.created_at,
    }));
  }

  private generateProfessionalMessage(product: any): string {
    return `Le informamos que tenemos disponible ${product.name} en nuestra farmacia. 
Precio: ${product.pricePPV} MAD. Para más información, no dude en contactarnos.`;
  }

  private generateFriendlyMessage(product: any): string {
    return `¡Hola! 😊 Queremos contarte que ya tenemos ${product.name} disponible. 
Pásate por la farmacia cuando puedas. ¡Te esperamos! ✨`;
  }

  private generateEnthusiasticMessage(product: any): string {
    return `🎉 ¡GRAN NOTICIA! 🎉\n\nYa llegó ${product.name} a nuestra farmacia. 
No te quedes sin el tuyo. ¡Corre que vuelan! 🏃‍♂️💨`;
  }

  private generateUrgentMessage(product: any): string {
    return `⚠️ ÚLTIMAS UNIDADES ⚠️\n\n${product.name} - ¡Stock limitado! 
Aprovecha antes de que se agote. 🏃‍♀️`;
  }
}

export const aiMessageGeneratorService = new AIMessageGeneratorService();

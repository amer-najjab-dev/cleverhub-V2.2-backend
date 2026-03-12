"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiMessageGeneratorService = exports.AIMessageGeneratorService = void 0;
const server_1 = require("../server");
class AIMessageGeneratorService {
    async generateMessage(productId, options = {}) {
        const product = await server_1.prisma.products.findUnique({
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
    async generateBulkMessages(productIds, options = {}) {
        const messages = [];
        for (const productId of productIds) {
            try {
                const message = await this.generateMessage(productId, options);
                messages.push({ productId, message });
            }
            catch (error) {
                console.error(`Error generando mensaje para producto ${productId}:`, error);
            }
        }
        return messages;
    }
    personalizeMessage(template, client, variables) {
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
    async saveGeneratedMessage(productId, message, tone, userId) {
        await server_1.prisma.ai_generated_messages.create({
            data: {
                product_id: productId,
                message,
                tone,
                created_by: userId,
            },
        });
    }
    async likeMessage(messageId) {
        await server_1.prisma.ai_generated_messages.update({
            where: { id: messageId },
            data: {
                like_count: {
                    increment: 1,
                },
            },
        });
    }
    async getPopularMessages(limit = 10) {
        const messages = await server_1.prisma.ai_generated_messages.findMany({
            where: {
                like_count: {
                    gt: 0,
                },
            },
            include: {
                product: true,
            },
            orderBy: {
                like_count: 'desc',
            },
            take: limit,
        });
        return messages.map((m) => ({
            id: m.id,
            message: m.message,
            tone: m.tone,
            likes: m.like_count,
            usageCount: m.usage_count,
            productName: m.product?.name,
            createdAt: m.created_at,
        }));
    }
    generateProfessionalMessage(product) {
        return `Le informamos que tenemos disponible ${product.name} en nuestra farmacia. 
Precio: ${product.pricePPV} MAD. Para más información, no dude en contactarnos.`;
    }
    generateFriendlyMessage(product) {
        return `¡Hola! 😊 Queremos contarte que ya tenemos ${product.name} disponible. 
Pásate por la farmacia cuando puedas. ¡Te esperamos! ✨`;
    }
    generateEnthusiasticMessage(product) {
        return `🎉 ¡GRAN NOTICIA! 🎉\n\nYa llegó ${product.name} a nuestra farmacia. 
No te quedes sin el tuyo. ¡Corre que vuelan! 🏃‍♂️💨`;
    }
    generateUrgentMessage(product) {
        return `⚠️ ÚLTIMAS UNIDADES ⚠️\n\n${product.name} - ¡Stock limitado! 
Aprovecha antes de que se agote. 🏃‍♀️`;
    }
}
exports.AIMessageGeneratorService = AIMessageGeneratorService;
exports.aiMessageGeneratorService = new AIMessageGeneratorService();

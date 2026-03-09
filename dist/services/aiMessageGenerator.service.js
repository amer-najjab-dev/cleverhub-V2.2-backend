"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiMessageGeneratorService = exports.AIMessageGeneratorService = void 0;
// backend/src/services/aiMessageGenerator.service.ts
const data_source_1 = require("../data-source");
const Product_1 = require("../entities/Product");
const AIGeneratedMessage_1 = require("../entities/AIGeneratedMessage");
class AIMessageGeneratorService {
    constructor() {
        this.messageRepo = data_source_1.AppDataSource.getRepository(AIGeneratedMessage_1.AIGeneratedMessage);
    }
    // Simular IA (en producción usarías OpenAI o similar)
    async generateMessages(productId, pointsCost, userId) {
        const product = await data_source_1.AppDataSource.getRepository(Product_1.Product)
            .findOne({ where: { id: productId } });
        if (!product)
            throw new Error('Product not found');
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
            const daysToExpiry = Math.ceil((product.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            messages.push({
                tone: 'urgent',
                message: this.generateUrgentMessage(product, daysToExpiry, pointsCost)
            });
        }
        // Guardar mensajes generados
        for (const msg of messages) {
            const aiMessage = new AIGeneratedMessage_1.AIGeneratedMessage();
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
    generateProfessionalMessage(product, pointsCost) {
        const pointsText = pointsCost ?
            ` par ${pointsCost} points` :
            ' à un prix spécial';
        return `Bonjour {{nombre_cliente}}, nous avons le plaisir de vous informer que ${product.name} est disponible${pointsText}. Profitez-en dès maintenant dans votre pharmacie CleverHub.`;
    }
    generateFriendlyMessage(product, pointsCost) {
        const pointsText = pointsCost ?
            ` à seulement ${pointsCost} points` :
            ' en promotion';
        return `Salut {{nombre_cliente}} 👋, on a pensé à toi ! ${product.name} est disponible${pointsText}. Viens vite le découvrir ! 🎁`;
    }
    generateUrgentMessage(product, daysToExpiry, pointsCost) {
        const pointsText = pointsCost ?
            ` à ${pointsCost} points` :
            '';
        return `⚠️ URGENT - DERNIÈRE CHANCE ⚠️\n\n{{nombre_cliente}}, il ne reste que ${daysToExpiry} jours avant l'expiration de ${product.name}${pointsText}. Ne ratez pas cette occasion unique !`;
    }
    // Obtener mensajes generados anteriormente
    async getRecentMessages(productId, limit = 5) {
        return this.messageRepo.find({
            where: { productId },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['createdByUser']
        });
    }
    // Registrar uso de mensaje
    async recordUsage(messageId) {
        await this.messageRepo.increment({ id: messageId }, 'usageCount', 1);
    }
    // Registrar like en mensaje
    async likeMessage(messageId) {
        await this.messageRepo.increment({ id: messageId }, 'likeCount', 1);
    }
}
exports.AIMessageGeneratorService = AIMessageGeneratorService;
exports.aiMessageGeneratorService = new AIMessageGeneratorService();

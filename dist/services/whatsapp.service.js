"use strict";
// Servicio simulador de WhatsApp para desarrollo
// En producción, conectarías con Twilio o similar
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = exports.WhatsAppService = void 0;
class WhatsAppService {
    async sendMessage(message) {
        try {
            // Simular envío de WhatsApp
            console.log(`📱 [SIMULADOR] Enviando WhatsApp a ${message.to}:`);
            console.log(`📝 Mensaje: ${message.body.substring(0, 100)}...`);
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));
            // Simular éxito (90% de tasa de éxito)
            const isSuccess = Math.random() < 0.9;
            if (isSuccess) {
                return {
                    success: true,
                    messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                };
            }
            else {
                return {
                    success: false,
                    error: 'Error simulado de envío',
                };
            }
        }
        catch (error) {
            console.error('Error en WhatsApp service:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async sendBulkMessages(messages) {
        console.log(`📱 Enviando ${messages.length} mensajes por WhatsApp...`);
        const results = await Promise.all(messages.map(msg => this.sendMessage(msg)));
        const successCount = results.filter(r => r.success).length;
        console.log(`✅ ${successCount}/${messages.length} mensajes enviados correctamente`);
        return results;
    }
    async getMessageStatus(messageId) {
        // Simular estado del mensaje
        const statuses = ['sent', 'delivered', 'read'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        return randomStatus;
    }
    async validatePhoneNumber(phone) {
        // Validación básica de número marroquí
        const moroccanRegex = /^(0|\\+212|00212)[5-7][0-9]{8}$/;
        return moroccanRegex.test(phone.replace(/\s/g, ''));
    }
    formatPhoneNumber(phone) {
        // Formatear número para Marruecos
        let cleaned = phone.replace(/\s/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '+212' + cleaned.substring(1);
        }
        else if (cleaned.startsWith('5') || cleaned.startsWith('6') || cleaned.startsWith('7')) {
            cleaned = '+212' + cleaned;
        }
        return cleaned;
    }
}
exports.WhatsAppService = WhatsAppService;
exports.whatsappService = new WhatsAppService();

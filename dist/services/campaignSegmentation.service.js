"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignSegmentationService = exports.CampaignSegmentationService = void 0;
const server_1 = require("../server");
class CampaignSegmentationService {
    async getClientsBySegments(segments) {
        let clients = [];
        for (const segment of segments) {
            const segmentClients = await this.getClientsBySegment(segment);
            clients = [...clients, ...segmentClients];
        }
        // Eliminar duplicados
        const uniqueClients = Array.from(new Map(clients.map(c => [c.id, c])).values());
        return uniqueClients;
    }
    async getClientsBySegment(criteria) {
        switch (criteria.type) {
            case 'all':
                return this.getAllClients();
            case 'chronic':
                return this.getChronicPatients(criteria.days);
            case 'dormant':
                return this.getDormantClients(criteria.days || 90);
            case 'vip':
                return this.getVipClients(criteria.minSpent || 5000);
            case 'birthday':
                return this.getBirthdayClients();
            case 'custom':
                return this.getCustomSegment(criteria.customQuery);
            default:
                return [];
        }
    }
    async getAllClients() {
        const clients = await server_1.prisma.clients.findMany({
            where: {
                phone: { not: null },
                consent: {
                    whatsapp: true,
                },
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                phone: true,
                email: true,
                birth_date: true,
                loyalty_points: true,
                total_purchases: true,
                last_purchase_date: true,
            },
        });
        return clients.map(c => ({
            id: c.id,
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
            email: c.email,
            birthDate: c.birth_date,
            loyaltyPoints: c.loyalty_points || 0,
            totalSpent: c.total_purchases || 0,
            lastPurchase: c.last_purchase_date,
        }));
    }
    async getChronicPatients(days) {
        const chronicKeywords = ['antihypertenseur', 'antidiabétique', 'hypolipémiant'];
        const clients = await server_1.prisma.clients.findMany({
            where: {
                phone: { not: null },
                consent: {
                    whatsapp: true,
                },
                sales: {
                    some: {
                        sale_items: {
                            some: {
                                products: {
                                    category: {
                                        in: chronicKeywords,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            include: {
                sales: {
                    where: days ? {
                        created_at: {
                            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                        },
                    } : undefined,
                    orderBy: {
                        created_at: 'desc',
                    },
                    take: 1,
                },
            },
        });
        return clients.map(c => ({
            id: c.id,
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
            lastPurchase: c.sales?.[0]?.created_at,
            segment: 'chronic',
        }));
    }
    async getDormantClients(days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const clients = await server_1.prisma.clients.findMany({
            where: {
                phone: { not: null },
                consent: {
                    whatsapp: true,
                },
                OR: [
                    {
                        sales: {
                            none: {},
                        },
                    },
                    {
                        sales: {
                            every: {
                                created_at: {
                                    lt: cutoffDate,
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                phone: true,
                last_purchase_date: true,
            },
        });
        return clients.map(c => ({
            id: c.id,
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
            lastPurchase: c.last_purchase_date,
            daysSinceLastPurchase: c.last_purchase_date
                ? Math.floor((Date.now() - new Date(c.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24))
                : days + 1,
            segment: 'dormant',
        }));
    }
    async getVipClients(minSpent) {
        const clients = await server_1.prisma.clients.findMany({
            where: {
                phone: { not: null },
                consent: {
                    whatsapp: true,
                },
                total_purchases: {
                    gte: minSpent,
                },
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                phone: true,
                total_purchases: true,
                last_purchase_date: true,
            },
        });
        return clients.map(c => ({
            id: c.id,
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
            totalSpent: c.total_purchases || 0,
            lastPurchase: c.last_purchase_date,
            segment: 'vip',
        }));
    }
    async getBirthdayClients() {
        const today = new Date();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();
        const clients = await server_1.prisma.clients.findMany({
            where: {
                phone: { not: null },
                consent: {
                    whatsapp: true,
                },
                birth_date: {
                    not: null,
                },
            },
        });
        // Filtrar por fecha de cumpleaños (mismo mes y día)
        const birthdayClients = clients.filter(c => {
            if (!c.birth_date)
                return false;
            const birthDate = new Date(c.birth_date);
            return birthDate.getMonth() + 1 === todayMonth &&
                birthDate.getDate() === todayDay;
        });
        return birthdayClients.map(c => ({
            id: c.id,
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
            birthDate: c.birth_date,
            segment: 'birthday',
        }));
    }
    async getCustomSegment(query) {
        // Para consultas personalizadas complejas
        // Por ahora, devolvemos un array vacío
        return [];
    }
    async getSegmentCount(criteria) {
        const clients = await this.getClientsBySegment(criteria);
        return clients.length;
    }
    async validateSegments(segments) {
        const errors = [];
        let total = 0;
        for (const segment of segments) {
            try {
                const count = await this.getSegmentCount(segment);
                total += count;
            }
            catch (error) {
                errors.push(`Error en segmento ${segment.type}: ${error}`);
            }
        }
        return {
            isValid: errors.length === 0,
            total,
            errors,
        };
    }
}
exports.CampaignSegmentationService = CampaignSegmentationService;
exports.campaignSegmentationService = new CampaignSegmentationService();

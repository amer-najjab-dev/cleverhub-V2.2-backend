"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignSegmentationService = exports.CampaignSegmentationService = void 0;
const data_source_1 = require("../data-source");
const Client_1 = require("../entities/Client");
const ClientConsent_1 = require("../entities/ClientConsent");
const Sale_1 = require("../entities/Sale");
class CampaignSegmentationService {
    constructor() {
        this.clientRepo = data_source_1.AppDataSource.getRepository(Client_1.Client);
        this.consentRepo = data_source_1.AppDataSource.getRepository(ClientConsent_1.ClientConsent);
        this.saleRepo = data_source_1.AppDataSource.getRepository(Sale_1.Sale);
    }
    async getEligibleClients(segments) {
        let query = this.clientRepo.createQueryBuilder('client')
            .innerJoinAndSelect('client.consent', 'consent')
            .where('consent.whatsapp = :whatsapp', { whatsapp: true });
        // Filtrar por nivel
        if (segments.tiers && segments.tiers.length > 0) {
            const tierConditions = segments.tiers.map(tier => {
                switch (tier) {
                    case 'Or':
                        return 'client.loyaltyPoints >= 5000';
                    case 'Argent':
                        return 'client.loyaltyPoints BETWEEN 2000 AND 4999';
                    case 'Bronze':
                        return 'client.loyaltyPoints < 2000';
                    default:
                        return '1=0';
                }
            }).join(' OR ');
            query = query.andWhere(`(${tierConditions})`);
        }
        // Filtrar por puntos
        if (segments.minPoints !== undefined) {
            query = query.andWhere('client.loyaltyPoints >= :minPoints', { minPoints: segments.minPoints });
        }
        if (segments.maxPoints !== undefined) {
            query = query.andWhere('client.loyaltyPoints <= :maxPoints', { maxPoints: segments.maxPoints });
        }
        // Filtrar por última compra
        if (segments.lastPurchaseDays !== undefined || segments.dormantDays !== undefined) {
            const days = segments.dormantDays || segments.lastPurchaseDays || 90;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            query = query.andWhere(qb => {
                const subQuery = qb.subQuery()
                    .select('MAX(sale.createdAt)')
                    .from(Sale_1.Sale, 'sale')
                    .where('sale.clientId = client.id')
                    .getQuery();
                return `COALESCE((${subQuery}), client.createdAt) < :cutoffDate`;
            }).setParameter('cutoffDate', cutoffDate);
        }
        return query.getMany();
    }
    // Obtener clientes dormidos (sin compras en X días)
    async getDormantClients(days = 90) {
        return this.getEligibleClients({ dormantDays: days });
    }
    // Segmentación por producto comprado
    async getClientsByProduct(productId) {
        return this.clientRepo.createQueryBuilder('client')
            .innerJoin('client.sales', 'sale')
            .innerJoin('sale.items', 'item')
            .where('item.productId = :productId', { productId })
            .andWhere(qb => {
            const subQuery = qb.subQuery()
                .select('1')
                .from(ClientConsent_1.ClientConsent, 'consent')
                .where('consent.clientId = client.id AND consent.whatsapp = true')
                .getQuery();
            return `EXISTS(${subQuery})`;
        })
            .groupBy('client.id')
            .getMany();
    }
    // Contar clientes elegibles
    async countEligibleClients(segments) {
        const clients = await this.getEligibleClients(segments);
        return clients.length;
    }
}
exports.CampaignSegmentationService = CampaignSegmentationService;
exports.campaignSegmentationService = new CampaignSegmentationService();

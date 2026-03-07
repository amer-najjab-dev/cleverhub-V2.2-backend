import { AppDataSource } from '../data-source';
import { Client } from '../entities/Client';
import { ClientConsent } from '../entities/ClientConsent';
import { Sale } from '../entities/Sale';
import { Between, LessThan } from 'typeorm';

export class CampaignSegmentationService {
  private clientRepo = AppDataSource.getRepository(Client);
  private consentRepo = AppDataSource.getRepository(ClientConsent);
  private saleRepo = AppDataSource.getRepository(Sale);

  async getEligibleClients(segments: {
    tiers?: ('Or' | 'Argent' | 'Bronze')[];
    dormantDays?: number;
    minPoints?: number;
    maxPoints?: number;
    lastPurchaseDays?: number;
    productIds?: number[];
  }): Promise<Client[]> {
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
          .from(Sale, 'sale')
          .where('sale.clientId = client.id')
          .getQuery();
        
        return `COALESCE((${subQuery}), client.createdAt) < :cutoffDate`;
      }).setParameter('cutoffDate', cutoffDate);
    }

    return query.getMany();
  }

  // Obtener clientes dormidos (sin compras en X días)
  async getDormantClients(days: number = 90): Promise<Client[]> {
    return this.getEligibleClients({ dormantDays: days });
  }

  // Segmentación por producto comprado
  async getClientsByProduct(productId: number): Promise<Client[]> {
    return this.clientRepo.createQueryBuilder('client')
      .innerJoin('client.sales', 'sale')
      .innerJoin('sale.items', 'item')
      .where('item.productId = :productId', { productId })
      .andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('1')
          .from(ClientConsent, 'consent')
          .where('consent.clientId = client.id AND consent.whatsapp = true')
          .getQuery();
        return `EXISTS(${subQuery})`;
      })
      .groupBy('client.id')
      .getMany();
  }

  // Contar clientes elegibles
  async countEligibleClients(segments: any): Promise<number> {
    const clients = await this.getEligibleClients(segments);
    return clients.length;
  }
}

export const campaignSegmentationService = new CampaignSegmentationService();
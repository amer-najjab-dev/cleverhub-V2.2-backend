import { prisma } from '../../server';

export interface EmergingTrend {
  laboratory: string;
  productIds: number[];
  productNames: string[];
  salesCount: number;
  period: 'week' | 'month';
  confidence: 'low' | 'medium' | 'high';
  recommendation: string;
}

export class TrendDetectionService {

  async detectEmergingTrends(days: number = 7): Promise<EmergingTrend[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await prisma.sales_items.findMany({
      where: {
        sales: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        products: true,
        sales: true,
      },
    });

    const labMap = new Map<string, {
      products: Set<number>;
      productNames: Set<string>;
      count: number;
    }>();

    sales.forEach((sales: any) => {
      const lab = sale.product?.laboratory;
      if (!lab || lab === 'NON RENSEIGNÉ') return;

      if (!labMap.has(lab)) {
        labMap.set(lab, {
          products: new Set(),
          productNames: new Set(),
          count: 0,
        });
      }

      const labData = labMap.get(lab)!;
      labData.products.add(sale.product_id);
      labData.productNames.add(sale.product?.name || 'Unknown');
      labData.count += sale.quantity;
    });

    const trends: EmergingTrend[] = [];
    const threshold = days === 7 ? 3 : 10;

    labMap.forEach((data, laboratory) => {
      if (data.count >= threshold) {
        let confidence: 'low' | 'medium' | 'high' = 'medium';
        let recommendation = '';

        if (data.count >= threshold * 2) {
          confidence = 'high';
          recommendation = `Augmentation significative des ventes ${laboratory}. Envisagez de réapprovisionner.`;
        } else {
          recommendation = `Tendance émergente détectée pour ${laboratory}. Surveiller les prochains jours.`;
        }

        trends.push({
          laboratory,
          productIds: Array.from(data.products),
          productNames: Array.from(data.productNames).slice(0, 3),
          salesCount: data.count,
          period: days === 7 ? 'week' : 'month',
          confidence,
          recommendation,
        });
      }
    });

    return trends.sort((a, b) => b.salessCount - a.salessCount);
  }

  async getWeeklyTrends(): Promise<EmergingTrend[]> {
    return this.detectEmergingTrends(7);
  }

  async getMonthlyTrends(): Promise<EmergingTrend[]> {
    return this.detectEmergingTrends(30);
  }
}

export const trendDetectionService = new TrendDetectionService();

import { AppDataSource } from '../../data-source';
import { Product } from '../../entities/Product';
import { SaleItem } from '../../entities/SaleItem';
import { Between } from 'typeorm';
import { seasonalMappingService } from './seasonalMapping.service';
import { marketBaselineService, MarketBaseline } from './marketBaseline.service';
import { trendDetectionService, EmergingTrend } from './trendDetection.service';

export interface HybridPrediction {
  productId: number;
  productName: string;
  category: string;
  laboratory?: string;
  currentStock: number;
  predictedDemandNext30Days: number;
  predictedDemandNext90Days: number;
  seasonalFactor: number;
  marketBaseline: MarketBaseline;
  realSalesLast30Days: number;
  recommendedOrder: number;
  safetyStock: number;
  reorderPoint: number;
  isEmergingTrend: boolean;
  trendAlert?: EmergingTrend;
  confidence: number;
  predictionSource: 'market' | 'hybrid' | 'real';
}

export class HybridPredictorService {
  private productRepo = AppDataSource.getRepository(Product);
  private saleItemRepo = AppDataSource.getRepository(SaleItem);

  async predictForProduct(productId: number): Promise<HybridPrediction> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const realSales = await this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.sale', 'sale')
      .where('item.productId = :productId', { productId })
      .andWhere('sale.createdAt >= :startDate', { startDate: thirtyDaysAgo })
      .getMany();

    const realSalesQuantity = realSales.reduce((sum, s) => sum + s.quantity, 0);
    const seasonalFactors = seasonalMappingService.getProductSeasonality(product);
    const baseline = marketBaselineService.getBaseline(product);

    let predictedDemand: number;
    let confidence: number;
    let source: 'market' | 'hybrid' | 'real';

    if (realSalesQuantity >= 10) {
      predictedDemand = realSalesQuantity * seasonalFactors.nextMonth;
      confidence = 80;
      source = 'real';
    } else if (realSalesQuantity > 0) {
      const weight = realSalesQuantity / 10;
      predictedDemand = (realSalesQuantity * seasonalFactors.nextMonth * (1 - weight)) + 
                       (baseline.expectedMonthlySales * seasonalFactors.nextMonth * weight);
      confidence = 50 + weight * 30;
      source = 'hybrid';
    } else {
      predictedDemand = baseline.expectedMonthlySales * seasonalFactors.nextMonth;
      confidence = baseline.confidence;
      source = 'market';
    }

    const safetyStock = Math.ceil(predictedDemand * 0.2);
    const reorderPoint = Math.ceil(predictedDemand * 0.5);
    const recommendedOrder = Math.max(0, Math.ceil(predictedDemand - product.stock + safetyStock));

    const trends = await trendDetectionService.getWeeklyTrends();
    const productTrend = trends.find(t => t.productIds.includes(product.id));

    return {
      productId: product.id,
      productName: product.name,
      category: product.category || '',
      laboratory: product.laboratory || undefined,
      currentStock: product.stock,
      predictedDemandNext30Days: Math.round(predictedDemand),
      predictedDemandNext90Days: Math.round(predictedDemand * 3 * seasonalFactors.nextQuarter),
      seasonalFactor: seasonalFactors.nextMonth,
      marketBaseline: baseline,
      realSalesLast30Days: realSalesQuantity,
      recommendedOrder,
      safetyStock,
      reorderPoint,
      isEmergingTrend: !!productTrend,
      trendAlert: productTrend,
      confidence: Math.round(confidence),
      predictionSource: source
    };
  }

  async predictForTopProducts(limit: number = 20): Promise<HybridPrediction[]> {
    const products = await this.productRepo
      .createQueryBuilder('p')
      .where('p.stock > 0 OR p.id IN (SELECT product_id FROM sale_items)')
      .limit(limit)
      .getMany();

    const predictions = await Promise.all(
      products.map(p => this.predictForProduct(p.id))
    );

    return predictions.sort((a, b) => b.predictedDemandNext30Days - a.predictedDemandNext30Days);
  }

  async getMarketIntelligence(): Promise<{
    seasonalHighRisk: string[];
    emergingTrends: EmergingTrend[];
    totalPredictedDemand: number;
    totalRecommendedInvestment: number;
  }> {
    const [trends, highRiskCategories, predictions] = await Promise.all([
      trendDetectionService.getWeeklyTrends(),
      Promise.resolve(seasonalMappingService.getHighRiskCategories()),
      this.predictForTopProducts(50)
    ]);

    const totalPredictedDemand = predictions.reduce((sum, p) => sum + p.predictedDemandNext30Days, 0);
    const totalRecommendedInvestment = predictions.reduce((sum, p) => 
      sum + (p.recommendedOrder * p.marketBaseline.expectedMonthlySales), 0
    );

    return {
      seasonalHighRisk: highRiskCategories,
      emergingTrends: trends,
      totalPredictedDemand,
      totalRecommendedInvestment
    };
  }
}

export const hybridPredictorService = new HybridPredictorService();
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hybridPredictorService = exports.HybridPredictorService = void 0;
const data_source_1 = require("../../data-source");
const Product_1 = require("../../entities/Product");
const SaleItem_1 = require("../../entities/SaleItem");
const seasonalMapping_service_1 = require("./seasonalMapping.service");
const marketBaseline_service_1 = require("./marketBaseline.service");
const trendDetection_service_1 = require("./trendDetection.service");
class HybridPredictorService {
    constructor() {
        this.productRepo = data_source_1.AppDataSource.getRepository(Product_1.Product);
        this.saleItemRepo = data_source_1.AppDataSource.getRepository(SaleItem_1.SaleItem);
    }
    async predictForProduct(productId) {
        const product = await this.productRepo.findOne({ where: { id: productId } });
        if (!product)
            throw new Error('Product not found');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const realSales = await this.saleItemRepo
            .createQueryBuilder('item')
            .leftJoin('item.sale', 'sale')
            .where('item.productId = :productId', { productId })
            .andWhere('sale.createdAt >= :startDate', { startDate: thirtyDaysAgo })
            .getMany();
        const realSalesQuantity = realSales.reduce((sum, s) => sum + s.quantity, 0);
        const seasonalFactors = seasonalMapping_service_1.seasonalMappingService.getProductSeasonality(product);
        const baseline = marketBaseline_service_1.marketBaselineService.getBaseline(product);
        let predictedDemand;
        let confidence;
        let source;
        if (realSalesQuantity >= 10) {
            predictedDemand = realSalesQuantity * seasonalFactors.nextMonth;
            confidence = 80;
            source = 'real';
        }
        else if (realSalesQuantity > 0) {
            const weight = realSalesQuantity / 10;
            predictedDemand = (realSalesQuantity * seasonalFactors.nextMonth * (1 - weight)) +
                (baseline.expectedMonthlySales * seasonalFactors.nextMonth * weight);
            confidence = 50 + weight * 30;
            source = 'hybrid';
        }
        else {
            predictedDemand = baseline.expectedMonthlySales * seasonalFactors.nextMonth;
            confidence = baseline.confidence;
            source = 'market';
        }
        const safetyStock = Math.ceil(predictedDemand * 0.2);
        const reorderPoint = Math.ceil(predictedDemand * 0.5);
        const recommendedOrder = Math.max(0, Math.ceil(predictedDemand - product.stock + safetyStock));
        const trends = await trendDetection_service_1.trendDetectionService.getWeeklyTrends();
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
    async predictForTopProducts(limit = 20) {
        const products = await this.productRepo
            .createQueryBuilder('p')
            .where('p.stock > 0 OR p.id IN (SELECT product_id FROM sale_items)')
            .limit(limit)
            .getMany();
        const predictions = await Promise.all(products.map(p => this.predictForProduct(p.id)));
        return predictions.sort((a, b) => b.predictedDemandNext30Days - a.predictedDemandNext30Days);
    }
    async getMarketIntelligence() {
        const [trends, highRiskCategories, predictions] = await Promise.all([
            trendDetection_service_1.trendDetectionService.getWeeklyTrends(),
            Promise.resolve(seasonalMapping_service_1.seasonalMappingService.getHighRiskCategories()),
            this.predictForTopProducts(50)
        ]);
        const totalPredictedDemand = predictions.reduce((sum, p) => sum + p.predictedDemandNext30Days, 0);
        const totalRecommendedInvestment = predictions.reduce((sum, p) => sum + (p.recommendedOrder * p.marketBaseline.expectedMonthlySales), 0);
        return {
            seasonalHighRisk: highRiskCategories,
            emergingTrends: trends,
            totalPredictedDemand,
            totalRecommendedInvestment
        };
    }
}
exports.HybridPredictorService = HybridPredictorService;
exports.hybridPredictorService = new HybridPredictorService();

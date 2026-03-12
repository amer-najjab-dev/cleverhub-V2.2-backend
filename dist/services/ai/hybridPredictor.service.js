"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hybridPredictorService = exports.HybridPredictorService = void 0;
const server_1 = require("../../server");
const seasonalMapping_service_1 = require("./seasonalMapping.service");
const marketBaseline_service_1 = require("./marketBaseline.service");
const trendDetection_service_1 = require("./trendDetection.service");
class HybridPredictorService {
    async predictForProduct(productId) {
        const product = await server_1.prisma.products.findUnique({
            where: { id: productId },
        });
        if (!product)
            throw new Error('Product not found');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const realSales = await server_1.prisma.sale_items.findMany({
            where: {
                product_id: productId,
                sale: {
                    created_at: {
                        gte: thirtyDaysAgo,
                    },
                },
            },
        });
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
            predictionSource: source,
        };
    }
    async predictForTopProducts(limit = 20) {
        const products = await server_1.prisma.products.findMany({
            where: {
                OR: [
                    { stock: { gt: 0 } },
                    { id: { in: await server_1.prisma.sale_items.findMany({ select: { product_id: true }, distinct: ['product_id'] }).then(items => items.map(i => i.product_id)) } },
                ],
            },
            take: limit,
        });
        const predictions = await Promise.all(products.map((p) => this.predictForProduct(p.id)));
        return predictions.sort((a, b) => b.predictedDemandNext30Days - a.predictedDemandNext30Days);
    }
    async getMarketIntelligence() {
        const [trends, highRiskCategories, predictions] = await Promise.all([
            trendDetection_service_1.trendDetectionService.getWeeklyTrends(),
            Promise.resolve(seasonalMapping_service_1.seasonalMappingService.getHighRiskCategories()),
            this.predictForTopProducts(50),
        ]);
        const totalPredictedDemand = predictions.reduce((sum, p) => sum + p.predictedDemandNext30Days, 0);
        const totalRecommendedInvestment = predictions.reduce((sum, p) => sum + (p.recommendedOrder * p.marketBaseline.expectedMonthlySales), 0);
        return {
            seasonalHighRisk: highRiskCategories,
            emergingTrends: trends,
            totalPredictedDemand,
            totalRecommendedInvestment,
        };
    }
}
exports.HybridPredictorService = HybridPredictorService;
exports.hybridPredictorService = new HybridPredictorService();

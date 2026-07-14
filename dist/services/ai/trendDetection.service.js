"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trendDetectionService = exports.TrendDetectionService = void 0;
const server_1 = require("../../server");
class TrendDetectionService {
    async detectEmergingTrends(days = 7) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const sales = await server_1.prisma.sales_items.findMany({
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
        const labMap = new Map();
        sales.forEach((sales) => {
            const lab = sale.product?.laboratory;
            if (!lab || lab === 'NON RENSEIGNÉ')
                return;
            if (!labMap.has(lab)) {
                labMap.set(lab, {
                    products: new Set(),
                    productNames: new Set(),
                    count: 0,
                });
            }
            const labData = labMap.get(lab);
            labData.products.add(sale.product_id);
            labData.productNames.add(sale.product?.name || 'Unknown');
            labData.count += sale.quantity;
        });
        const trends = [];
        const threshold = days === 7 ? 3 : 10;
        labMap.forEach((data, laboratory) => {
            if (data.count >= threshold) {
                let confidence = 'medium';
                let recommendation = '';
                if (data.count >= threshold * 2) {
                    confidence = 'high';
                    recommendation = `Augmentation significative des ventes ${laboratory}. Envisagez de réapprovisionner.`;
                }
                else {
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
    async getWeeklyTrends() {
        return this.detectEmergingTrends(7);
    }
    async getMonthlyTrends() {
        return this.detectEmergingTrends(30);
    }
}
exports.TrendDetectionService = TrendDetectionService;
exports.trendDetectionService = new TrendDetectionService();

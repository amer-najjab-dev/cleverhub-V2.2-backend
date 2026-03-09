"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trendDetectionService = exports.TrendDetectionService = void 0;
const data_source_1 = require("../../data-source");
const SaleItem_1 = require("../../entities/SaleItem");
class TrendDetectionService {
    constructor() {
        this.saleItemRepo = data_source_1.AppDataSource.getRepository(SaleItem_1.SaleItem);
    }
    async detectEmergingTrends(days = 7) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const sales = await this.saleItemRepo
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.sale', 'sale')
            .leftJoinAndSelect('item.product', 'product')
            .where('sale.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
            .getMany();
        const labMap = new Map();
        sales.forEach(sale => {
            const lab = sale.product?.laboratory;
            if (!lab || lab === 'NON RENSEIGNÉ')
                return;
            if (!labMap.has(lab)) {
                labMap.set(lab, {
                    products: new Set(),
                    productNames: new Set(),
                    count: 0
                });
            }
            const labData = labMap.get(lab);
            labData.products.add(sale.productId);
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
                    recommendation
                });
            }
        });
        return trends.sort((a, b) => b.salesCount - a.salesCount);
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

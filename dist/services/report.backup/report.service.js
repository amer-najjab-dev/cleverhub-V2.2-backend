"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = exports.ReportService = void 0;
// src/services/report/report.service.ts
const server_1 = require("../../server");
const date_fns_1 = require("date-fns");
class ReportService {
    async getCashClosure(date, userId) {
        const startDate = (0, date_fns_1.startOfDay)(new Date(date));
        const endDate = (0, date_fns_1.endOfDay)(new Date(date));
        const sales = await server_1.prisma.sales.findMany({
            where: {
                created_at: { gte: startDate, lte: endDate },
                sale_status: 'completed'
            }
        });
        const payments = await server_1.prisma.payments.findMany({
            where: { created_at: { gte: startDate, lte: endDate } }
        });
        const user = await server_1.prisma.users.findUnique({ where: { id: userId } });
        const grossSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
        const paymentSummary = {
            cash: payments.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0),
            card: payments.filter(p => p.payment_method === 'Credit Card').reduce((sum, p) => sum + Number(p.amount), 0),
            transfer: payments.filter(p => p.payment_method === 'Bank Transfer').reduce((sum, p) => sum + Number(p.amount), 0),
            check: payments.filter(p => p.payment_method === 'Bank Cheque').reduce((sum, p) => sum + Number(p.amount), 0),
            credit: sales.filter(s => s.payment_method === 'credit').reduce((sum, s) => sum + Number(s.total), 0),
            mixed: sales.filter(s => s.payment_method === 'mixed').reduce((sum, s) => sum + Number(s.total), 0)
        };
        return {
            id: `closure-${date}`,
            date,
            user: user ? { id: user.id, fullName: user.full_name || 'Admin' } : { id: userId, fullName: 'Admin' },
            fiscalData: {
                companyName: 'Pharmacie CleverHub',
                if: 'IF123456',
                ice: 'ICE123456789',
                rc: 'RC12345',
                cnss: 'CNSS12345',
                address: '15 Boulevard Mohammed V',
                city: 'Casablanca'
            },
            sales: {
                grossSales,
                vatBreakdown: { vat7: 0, vat10: 0, vat14: 0, vat20: grossSales * 0.2, vatExempt: 0 },
                netSales: grossSales - (grossSales * 0.2),
                discountTotal: 0,
                returnsTotal: 0
            },
            payments: paymentSummary,
            cashAudit: {
                initialFund: 1000,
                expectedCash: paymentSummary.cash + 1000,
                actualCash: paymentSummary.cash + 1000,
                discrepancy: 0,
                manualEntries: [],
                safeDrop: 0
            },
            createdAt: new Date().toISOString()
        };
    }
    async validateClosure(data) {
        return { success: true };
    }
    async resolveDiscrepancy(data) {
        return { success: true };
    }
    // ========== NUEVOS MÉTODOS PARA DASHBOARD ==========
    async getDashboardKPIs(period) {
        const endDate = new Date();
        let startDate = new Date();
        switch (period) {
            case 'week':
                startDate = (0, date_fns_1.subWeeks)(endDate, 1);
                break;
            case 'month':
                startDate = (0, date_fns_1.subMonths)(endDate, 1);
                break;
            case 'quarter':
                startDate = (0, date_fns_1.subMonths)(endDate, 3);
                break;
            default:
                startDate = (0, date_fns_1.subWeeks)(endDate, 1);
        }
        const sales = await server_1.prisma.sales.findMany({
            where: {
                created_at: { gte: startDate, lte: endDate },
                sale_status: 'completed'
            }
        });
        const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
        const previousStartDate = (0, date_fns_1.subDays)(startDate, endDate.getTime() - startDate.getTime());
        const previousSales = await server_1.prisma.sales.findMany({
            where: {
                created_at: { gte: previousStartDate, lte: startDate },
                sale_status: 'completed'
            }
        });
        const previousTotal = previousSales.reduce((sum, s) => sum + Number(s.total), 0);
        const salesGrowth = previousTotal > 0 ? ((totalSales - previousTotal) / previousTotal) * 100 : 0;
        const products = await server_1.prisma.products.findMany();
        const totalStockValue = products.reduce((sum, p) => sum + Number(p.pricePPH) * p.stock, 0);
        const lowStockCount = products.filter(p => p.stock < 10).length;
        const pendingOrders = await server_1.prisma.sales.count({
            where: { payment_status: 'pending' }
        });
        return {
            totalStockValue,
            averageMargin: 0,
            expiringPercentage: 0,
            totalSales,
            salesGrowth,
            lowStockCount,
            pendingOrders
        };
    }
    async getSalesTrend(period) {
        const endDate = new Date();
        let startDate = new Date();
        switch (period) {
            case 'week':
                startDate = (0, date_fns_1.subWeeks)(endDate, 1);
                break;
            case 'month':
                startDate = (0, date_fns_1.subMonths)(endDate, 1);
                break;
            case 'quarter':
                startDate = (0, date_fns_1.subMonths)(endDate, 3);
                break;
            default:
                startDate = (0, date_fns_1.subWeeks)(endDate, 1);
        }
        const sales = await server_1.prisma.sales.findMany({
            where: {
                created_at: { gte: startDate, lte: endDate },
                sale_status: 'completed'
            },
            orderBy: { created_at: 'asc' }
        });
        const trend = sales.map(s => ({
            date: s.created_at?.toISOString().split('T')[0] || '',
            actual: Number(s.total),
            previous: 0
        }));
        return trend;
    }
    async getTopProducts(limit, period) {
        return [];
    }
    async getLostSales(period) {
        return [];
    }
}
exports.ReportService = ReportService;
exports.reportService = new ReportService();

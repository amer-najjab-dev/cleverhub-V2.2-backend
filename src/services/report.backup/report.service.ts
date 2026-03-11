// src/services/report/report.service.ts
import { prisma } from '../../server';
import { startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';

export class ReportService {
  
  async getCashClosure(date: string, userId: number) {
    const startDate = startOfDay(new Date(date));
    const endDate = endOfDay(new Date(date));

    const sales = await prisma.sales.findMany({
      where: {
        created_at: { gte: startDate, lte: endDate },
        sale_status: 'completed'
      }
    });

    const payments = await prisma.payments.findMany({
      where: { created_at: { gte: startDate, lte: endDate } }
    });

    const user = await prisma.users.findUnique({ where: { id: userId } });

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

  async validateClosure(data: any) {
    return { success: true };
  }

  async resolveDiscrepancy(data: any) {
    return { success: true };
  }

  // ========== NUEVOS MÉTODOS PARA DASHBOARD ==========

  async getDashboardKPIs(period: string) {
    const endDate = new Date();
    let startDate = new Date();

    switch(period) {
      case 'week':
        startDate = subWeeks(endDate, 1);
        break;
      case 'month':
        startDate = subMonths(endDate, 1);
        break;
      case 'quarter':
        startDate = subMonths(endDate, 3);
        break;
      default:
        startDate = subWeeks(endDate, 1);
    }

    const sales = await prisma.sales.findMany({
      where: {
        created_at: { gte: startDate, lte: endDate },
        sale_status: 'completed'
      }
    });

    const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
    
    const previousStartDate = subDays(startDate, endDate.getTime() - startDate.getTime());
    
    const previousSales = await prisma.sales.findMany({
      where: {
        created_at: { gte: previousStartDate, lte: startDate },
        sale_status: 'completed'
      }
    });

    const previousTotal = previousSales.reduce((sum, s) => sum + Number(s.total), 0);
    const salesGrowth = previousTotal > 0 ? ((totalSales - previousTotal) / previousTotal) * 100 : 0;

    const products = await prisma.products.findMany();
    const totalStockValue = products.reduce((sum, p) => sum + Number(p.pricePPH) * p.stock, 0);

    const lowStockCount = products.filter(p => p.stock < 10).length;

    const pendingOrders = await prisma.sales.count({
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

  async getSalesTrend(period: string) {
    const endDate = new Date();
    let startDate = new Date();

    switch(period) {
      case 'week':
        startDate = subWeeks(endDate, 1);
        break;
      case 'month':
        startDate = subMonths(endDate, 1);
        break;
      case 'quarter':
        startDate = subMonths(endDate, 3);
        break;
      default:
        startDate = subWeeks(endDate, 1);
    }

    const sales = await prisma.sales.findMany({
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

  async getTopProducts(limit: number, period: string) {
    return [];
  }

  async getLostSales(period: string) {
    return [];
  }
}

export const reportService = new ReportService();
import { prisma } from "../../server";

export class ReportService {
  
  async getCashClosure(date: string, userId: number) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Obtener ventas del día con Prisma
    const sales = await prisma.sales.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
        sale_status: 'completed',
      },
      include: {
        sale_items: {
          include: {
            product: true,
          },
        },
        client: true,
        user: true,
      },
    });

    // Obtener pagos del día
    const payments = await prisma.payments.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Calcular ventas brutas y netas
    const grossSales = sales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    const discountTotal = sales.reduce((sum: number, s: any) => sum + Number(s.discount_amount || 0), 0);
    
    // Calcular margen bruto
    let totalCost = 0;
    let totalRevenue = 0;
    
    sales.forEach((sale: any) => {
      sale.sale_items?.forEach((item: any) => {
        totalRevenue += Number(item.total);
        totalCost += Number(item.quantity) * Number(item.unit_price_pph || 0);
      });
    });

    const grossMargin = totalRevenue - totalCost;
    const marginPercentage = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    // Desglose de IVA (simplificado)
    const vatBreakdown = {
      vat7: 0,
      vat10: 0,
      vat14: 0,
      vat20: grossSales * 0.2,
      vatExempt: 0
    };
    
    const netSales = grossSales - vatBreakdown.vat20;

    // Inicializar contadores de pagos
    let totalCash = 0;
    let totalCard = 0;
    let totalTransfer = 0;
    let totalCheck = 0;
    let totalCredit = 0;

    // Procesar pagos
    payments.forEach((payment: any) => {
      const amount = Number(payment.amount);
      switch (payment.payment_method?.toLowerCase()) {
        case 'cash':
        case 'espèces':
        case 'efectivo':
          totalCash += amount;
          break;
        case 'card':
        case 'carte bancaire':
        case 'tarjeta':
        case 'credit card':
          totalCard += amount;
          break;
        case 'transfer':
        case 'virement':
        case 'transferencia':
        case 'bank transfer':
          totalTransfer += amount;
          break;
        case 'check':
        case 'chèque':
        case 'cheque':
        case 'bank cheque':
          totalCheck += amount;
          break;
      }
    });

    // Procesar ventas para créditos
    sales.forEach((sale: any) => {
      const saleTotal = Number(sale.total);
      const method = sale.payment_method?.toLowerCase() || '';
      
      if (method === 'credit' || method === 'credito') {
        totalCredit += saleTotal;
      } 
      else if (method === 'mixed' || method === 'mixto') {
        totalCash += saleTotal * 0.5;
        totalCredit += saleTotal * 0.5;
      }
    });

    const paymentSummary = {
      cash: totalCash,
      card: totalCard,
      transfer: totalTransfer,
      check: totalCheck,
      credit: totalCredit,
    };

    // Obtener usuario
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    // Calcular productos más vendidos
    const productSales = new Map();
    sales.forEach((sale: any) => {
      sale.sale_items?.forEach((item: any) => {
        const productId = item.product_id;
        if (!productSales.has(productId)) {
          productSales.set(productId, {
            productId,
            productName: item.product?.name || 'Unknown',
            quantity: 0,
            revenue: 0,
            margin: 0
          });
        }
        const prod = productSales.get(productId);
        prod.quantity += item.quantity;
        prod.revenue += Number(item.total);
        prod.margin += Number(item.margin || 0);
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

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
        vatBreakdown,
        netSales,
        discountTotal,
        returnsTotal: 0,
        margin: {
          total: grossMargin,
          percentage: marginPercentage
        }
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
      topProducts,
      createdAt: new Date().toISOString()
    };
  }

  async validateClosure(data: any) {
    console.log('Cierre validado:', data);
    return { success: true };
  }

  async resolveDiscrepancy(data: any) {
    console.log('Discrepancia resuelta:', data);
    return { success: true };
  }

  async getDashboardKPIs(period: string) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch(period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Ventas del período
    const sales = await prisma.sales.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        sale_status: 'completed',
      },
    });

    const totalSales = sales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    
    // Ventas del período anterior
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    
    const previousSales = await prisma.sales.findMany({
      where: {
        created_at: {
          gte: previousStartDate,
          lte: startDate,
        },
        sale_status: 'completed',
      },
    });
    
    const previousTotal = previousSales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    const salesGrowth = previousTotal > 0 ? ((totalSales - previousTotal) / previousTotal) * 100 : 0;

    // Valor total del stock
    const products = await prisma.products.findMany();
    const totalStockValue = products.reduce((sum: number, p: any) => sum + Number(p.pricePPH) * p.stock, 0);

    // Margen promedio
    const items = await prisma.sale_items.findMany({
      where: {
        sale: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    });
    
    const totalMargin = items.reduce((sum: number, i: any) => sum + Number(i.margin || 0), 0);
    const averageMargin = totalSales > 0 ? (totalMargin / totalSales) * 100 : 0;

    // Productos próximos a caducar
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    const expiringProducts = products.filter((p: any) => {
      if (!p.expirationDate) return false;
      return new Date(p.expirationDate) <= threeMonthsFromNow;
    });
    
    const expiringPercentage = products.length > 0 ? (expiringProducts.length / products.length) * 100 : 0;

    // Stock bajo
    const lowStockCount = products.filter((p: any) => p.stock < 10).length;

    // Pedidos pendientes
    const pendingOrders = await prisma.sales.count({
      where: { payment_status: 'pending' }
    });

    return {
      totalStockValue,
      averageMargin,
      expiringPercentage,
      totalSales,
      salesGrowth,
      lowStockCount,
      pendingOrders
    };
  }

  async getSalesTrend(period: string) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch(period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Ventas agrupadas por día
    const sales = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, SUM(total) as total
      FROM sales
      WHERE created_at BETWEEN ${startDate} AND ${endDate}
      AND sale_status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Período anterior
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    
    const previousSales = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, SUM(total) as total
      FROM sales
      WHERE created_at BETWEEN ${previousStartDate} AND ${startDate}
      AND sale_status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const trend = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const currentSale = (sales as any[]).find((s: any) => {
        const saleDate = s.date instanceof Date ? s.date.toISOString().split('T')[0] : s.date;
        return saleDate === dateStr;
      });
      const previousSale = (previousSales as any[]).find((s: any) => {
        const saleDate = s.date instanceof Date ? s.date.toISOString().split('T')[0] : s.date;
        return saleDate === dateStr;
      });
      
      trend.push({
        date: dateStr,
        actual: currentSale ? Number(currentSale.total) : 0,
        previous: previousSale ? Number(previousSale.total) : 0
      });
    }

    return trend;
  }

  async getTopProducts(limit: number, period: string) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch(period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const products = await prisma.sale_items.groupBy({
      by: ['product_id'],
      where: {
        sale: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          sale_status: 'completed',
        },
      },
      _sum: {
        quantity: true,
        total: true,
        margin: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const productIds = products.map(p => p.product_id);
    const productDetails = await prisma.products.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        category: true,
      },
    });

    const productMap = new Map(productDetails.map(p => [p.id, p]));

    return products.map(p => {
      const details = productMap.get(p.product_id);
      return {
        id: p.product_id,
        name: details?.name || 'Unknown',
        category: details?.category || 'Unknown',
        quantity: Number(p._sum?.quantity || 0),
        revenue: Number(p._sum?.total || 0),
        margin: Number(p._sum?.margin || 0),
        marginPercentage: Number(p._sum?.total || 0) > 0 
          ? (Number(p._sum?.margin || 0) / Number(p._sum?.total || 0)) * 100 
          : 0,
      };
    });
  }
  
  async getLostSales(period: string) {
    return [];
  }
}

export const reportService = new ReportService();
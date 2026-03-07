import { AppDataSource } from '../../data-source';
import { Sale } from '../../entities/Sale';
import { Payment } from '../../entities/Payment';
import { Between } from 'typeorm';
import { User } from '../../entities/User';
import { SaleItem } from '../../entities/SaleItem';
import { Product } from '../../entities/Product';

export class ReportService {
  
  async getCashClosure(date: string, userId: number) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const saleRepo = AppDataSource.getRepository(Sale);
    const paymentRepo = AppDataSource.getRepository(Payment);
    const userRepo = AppDataSource.getRepository(User);
    const saleItemRepo = AppDataSource.getRepository(SaleItem);

    // Obtener ventas del día
    const sales = await saleRepo.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
        saleStatus: 'completed'
      },
      relations: ['items', 'items.product']
    });

    // Obtener pagos del día
    const payments = await paymentRepo.find({
      where: {
        createdAt: Between(startOfDay, endOfDay)
      }
    });

    // Calcular ventas brutas y netas
    const grossSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const discountTotal = sales.reduce((sum, s) => sum + Number(s.discountAmount || 0), 0);
    
    // Calcular margen bruto
    let totalCost = 0;
    let totalRevenue = 0;
    
    sales.forEach(sale => {
      sale.items?.forEach(item => {
        totalRevenue += Number(item.total);
        totalCost += Number(item.quantity) * Number(item.unitPricePPH || 0);
      });
    });

    const grossMargin = totalRevenue - totalCost;
    const marginPercentage = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    // Desglose de IVA (simplificado - asumiendo 20% general)
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

    // 1. Procesar pagos de la tabla payments
    payments.forEach(payment => {
      const amount = Number(payment.amount);
      switch (payment.paymentMethod?.toLowerCase()) {
        case 'cash':
        case 'espèces':
          totalCash += amount;
          break;
        case 'card':
        case 'carte bancaire':
        case 'credit card':
          totalCard += amount;
          break;
        case 'transfer':
        case 'virement':
        case 'bank transfer':
          totalTransfer += amount;
          break;
        case 'check':
        case 'chèque':
        case 'bank cheque':
          totalCheck += amount;
          break;
      }
    });

    // 2. Procesar ventas (para créditos y partes de ventas mixtas)
    sales.forEach(sale => {
      const saleTotal = Number(sale.total);
      const method = sale.paymentMethod?.toLowerCase() || '';
      
      if (method === 'credit') {
        // Venta puramente a crédito
        totalCredit += saleTotal;
      } 
      else if (method === 'mixed' || method === 'mixte') {
        // Venta mixta - necesitamos saber la distribución
        // Por ahora, asumimos distribución 50/50 entre efectivo y crédito
        // Idealmente, deberías tener una tabla intermedia que guarde la distribución
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

    const user = await userRepo.findOne({ where: { id: userId } });

    // Calcular productos más vendidos
    const productSales = new Map();
    sales.forEach(sale => {
      sale.items?.forEach(item => {
        const productId = item.productId;
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
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      id: `closure-${date}`,
      date,
      user: user ? { id: user.id, fullName: user.fullName || 'Admin' } : { id: userId, fullName: 'Admin' },
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
    // Calcular fechas según período
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

    const saleRepo = AppDataSource.getRepository(Sale);
    const productRepo = AppDataSource.getRepository(Product);

    // Ventas del período
    const sales = await saleRepo.find({
      where: {
        createdAt: Between(startDate, endDate),
        saleStatus: 'completed'
      }
    });

    const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
    
    // Ventas del período anterior (para calcular crecimiento)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const previousSales = await saleRepo.find({
      where: {
        createdAt: Between(previousStartDate, startDate),
        saleStatus: 'completed'
      }
    });
    
    const previousTotal = previousSales.reduce((sum, s) => sum + Number(s.total), 0);
    const salesGrowth = previousTotal > 0 ? ((totalSales - previousTotal) / previousTotal) * 100 : 0;

    // Valor total del stock (PPH)
    const products = await productRepo.find();
    const totalStockValue = products.reduce((sum, p) => sum + Number(p.pricePPH) * p.stock, 0);

    // Margen promedio
    const saleItemRepo = AppDataSource.getRepository(SaleItem);
    const items = await saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.sale', 'sale')
      .where('sale.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getMany();
    
    const totalMargin = items.reduce((sum, i) => sum + Number(i.margin || 0), 0);
    const averageMargin = totalSales > 0 ? (totalMargin / totalSales) * 100 : 0;

    // Productos próximos a caducar
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    const expiringProducts = products.filter(p => {
      if (!p.expirationDate) return false;
      return new Date(p.expirationDate) <= threeMonthsFromNow;
    });
    
    const expiringPercentage = products.length > 0 ? (expiringProducts.length / products.length) * 100 : 0;

    // Stock bajo (< 10)
    const lowStockCount = products.filter(p => p.stock < 10).length;

    // Pedidos pendientes
    const pendingOrders = await saleRepo.count({
      where: { paymentStatus: 'pending' }
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

    const saleRepo = AppDataSource.getRepository(Sale);
    
    // Ventas del período actual agrupadas por día
    const sales = await saleRepo
      .createQueryBuilder('sale')
      .select('DATE(sale.createdAt)', 'date')
      .addSelect('SUM(sale.total)', 'total')
      .where('sale.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('sale.saleStatus = :status', { status: 'completed' })
      .groupBy('DATE(sale.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Período anterior para comparación
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    
    const previousSales = await saleRepo
      .createQueryBuilder('sale')
      .select('DATE(sale.createdAt)', 'date')
      .addSelect('SUM(sale.total)', 'total')
      .where('sale.createdAt BETWEEN :start AND :end', { start: previousStartDate, end: startDate })
      .andWhere('sale.saleStatus = :status', { status: 'completed' })
      .groupBy('DATE(sale.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Combinar datos
    const trend = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const currentSale = sales.find(s => s.date === dateStr);
      const previousSale = previousSales.find(s => s.date === dateStr);
      
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

    const saleItemRepo = AppDataSource.getRepository(SaleItem);
    
    const products = await saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('item.sale', 'sale')
      .select('product.id', 'id')
      .addSelect('product.name', 'name')
      .addSelect('product.category', 'category')
      .addSelect('SUM(item.quantity)', 'quantity')
      .addSelect('SUM(item.total)', 'revenue')
      .addSelect('SUM(item.margin)', 'margin')
      .where('sale.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('sale.saleStatus = :status', { status: 'completed' })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.category')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(limit)
      .getRawMany();

    return products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      quantity: Number(p.quantity),
      revenue: Number(p.revenue),
      margin: Number(p.margin || 0),
      marginPercentage: Number(p.revenue) > 0 ? (Number(p.margin || 0) / Number(p.revenue)) * 100 : 0
    }));
  }
  
  async getLostSales(period: string) {
    // Simulación de ventas perdidas (en un sistema real, esto vendría de una tabla de eventos)
    // Por ahora devolvemos un array vacío
    return [];
  }
  
}

export const reportService = new ReportService();

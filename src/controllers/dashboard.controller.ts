import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Sale } from '../entities/Sale';
import { SaleItem } from '../entities/SaleItem';
import { Product } from '../entities/Product';
import { Between, LessThan, MoreThan } from 'typeorm';

export class DashboardController {
  /**
   * Obtener KPIs principales del dashboard
   * GET /api/dashboard/kpis?period=today|week|month
   */
  async getKPIs(req: Request, res: Response) {
    try {
      const { period = 'today' } = req.query;
      
      // Calcular fechas según período
      const now = new Date();
      let startDate: Date;
      
      switch(period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0));
      }

      const saleRepo = AppDataSource.getRepository(Sale);
      
      // Ventas del período actual
      const currentPeriodSales = await saleRepo.find({
        where: {
          createdAt: MoreThan(startDate),
          saleStatus: 'completed'
        }
      });

      // Ventas del período anterior (para calcular crecimiento)
      const periodLength = now.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodLength);
      
      const previousPeriodSales = await saleRepo.find({
        where: {
          createdAt: Between(previousStartDate, startDate),
          saleStatus: 'completed'
        }
      });

      // Calcular totales
      const todaySales = currentPeriodSales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const previousTotal = previousPeriodSales.reduce((sum, sale) => sum + Number(sale.total), 0);
      
      // Calcular ticket medio
      const averageTicket = currentPeriodSales.length > 0 
        ? todaySales / currentPeriodSales.length 
        : 0;

      // Contar productos con stock bajo
      const productRepo = AppDataSource.getRepository(Product);
      const lowStockCount = await productRepo.count({
        where: {
          stock: LessThan(10),
          active: true
        }
      });

      // Calcular crecimiento
      const growth = previousTotal > 0 
        ? ((todaySales - previousTotal) / previousTotal) * 100 
        : 0;

      // Calcular beneficio total (opcional)
      const saleItemRepo = AppDataSource.getRepository(SaleItem);
      const items = await saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.sale', 'sale')
        .where('sale.createdAt > :startDate', { startDate })
        .andWhere('sale.saleStatus = :status', { status: 'completed' })
        .getMany();

      const totalProfit = items.reduce((sum, item) => sum + Number(item.margin || 0), 0);
      
      // Calcular margen promedio
      const averageMargin = todaySales > 0 ? (totalProfit / todaySales) * 100 : 0;

      // Contar pedidos pendientes
      const pendingOrders = await saleRepo.count({
        where: {
          paymentStatus: 'pending',
          saleStatus: 'completed'
        }
      });

      res.json({
        success: true,
        data: {
          todaySales,
          weekSales: period === 'week' ? todaySales : 0,
          averageTicket,
          lowStockCount,
          growth,
          totalSales: todaySales,
          totalProfit,
          averageMargin,
          pendingOrders
        }
      });

    } catch (error: any) {
      console.error('Error en getKPIs:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener ventas por hora para un día específico
   * GET /api/dashboard/hourly-sales?date=YYYY-MM-DD
   */
  async getHourlySales(req: Request, res: Response) {
    try {
      const { date } = req.query;
      
      let targetDate = date ? new Date(date as string) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const saleItemRepo = AppDataSource.getRepository(SaleItem);
      
      // Consulta para obtener ventas agrupadas por hora
      const hourlyData = await saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.sale', 'sale')
        .select('EXTRACT(HOUR FROM sale.createdAt)', 'hour')
        .addSelect('SUM(item.total)', 'value')
        .where('sale.createdAt BETWEEN :startDate AND :endDate', { 
          startDate: targetDate, 
          endDate: nextDay 
        })
        .andWhere('sale.saleStatus = :status', { status: 'completed' })
        .groupBy('EXTRACT(HOUR FROM sale.createdAt)')
        .orderBy('hour', 'ASC')
        .getRawMany();

      // Formatear resultado para el frontend
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const result = hours.map(hour => {
        const found = hourlyData.find(d => Number(d.hour) === hour);
        return {
          hour: `${hour}:00`,
          value: found ? Number(found.value) : 0
        };
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Error en getHourlySales:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener datos comparativos (semana actual vs anterior)
   * GET /api/dashboard/comparative
   */
  async getComparativeData(req: Request, res: Response) {
    try {
      const now = new Date();
      
      // Semana actual (últimos 7 días)
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      
      // Semana anterior (7 días antes de weekStart)
      const previousWeekStart = new Date(weekStart);
      previousWeekStart.setDate(weekStart.getDate() - 7);

      const saleRepo = AppDataSource.getRepository(Sale);
      
      // Obtener ventas de la semana actual agrupadas por día
      const currentWeekSales = await saleRepo
        .createQueryBuilder('sale')
        .select('EXTRACT(DOW FROM sale.createdAt)', 'dayOfWeek')
        .addSelect('SUM(sale.total)', 'total')
        .where('sale.createdAt BETWEEN :start AND :now', { 
          start: weekStart, 
          now 
        })
        .andWhere('sale.saleStatus = :status', { status: 'completed' })
        .groupBy('EXTRACT(DOW FROM sale.createdAt)')
        .getRawMany();

      // Obtener ventas de la semana anterior agrupadas por día
      const previousWeekSales = await saleRepo
        .createQueryBuilder('sale')
        .select('EXTRACT(DOW FROM sale.createdAt)', 'dayOfWeek')
        .addSelect('SUM(sale.total)', 'total')
        .where('sale.createdAt BETWEEN :start AND :end', { 
          start: previousWeekStart, 
          end: weekStart 
        })
        .andWhere('sale.saleStatus = :status', { status: 'completed' })
        .groupBy('EXTRACT(DOW FROM sale.createdAt)')
        .getRawMany();

      // Días de la semana en español
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      const result = [];
      for (let i = 1; i <= 7; i++) {
        const dayIndex = i % 7;
        const currentDay = currentWeekSales.find(d => Number(d.dayOfWeek) === dayIndex);
        const previousDay = previousWeekSales.find(d => Number(d.dayOfWeek) === dayIndex);
        
        result.push({
          day: dayNames[dayIndex],
          actual: currentDay ? Number(currentDay.total) : 0,
          previous: previousDay ? Number(previousDay.total) : 0
        });
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Error en getComparativeData:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener top productos más vendidos
   * GET /api/dashboard/top-products?limit=10&period=week
   */
  async getTopProducts(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 10;
      const period = (req.query.period as string) || 'week';
      
      const now = new Date();
      let startDate: Date;
      
      switch(period) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      const saleItemRepo = AppDataSource.getRepository(SaleItem);
      
      const topProducts = await saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.product', 'product')
        .leftJoin('item.sale', 'sale')
        .select('product.id', 'id')
        .addSelect('product.name', 'name')
        .addSelect('product.category', 'category')
        .addSelect('SUM(item.quantity)', 'sales')
        .addSelect('SUM(item.total)', 'revenue')
        .where('sale.createdAt > :startDate', { startDate })
        .andWhere('sale.saleStatus = :status', { status: 'completed' })
        .groupBy('product.id')
        .addGroupBy('product.name')
        .addGroupBy('product.category')
        .orderBy('SUM(item.quantity)', 'DESC')
        .limit(limit)
        .getRawMany();

      // Calcular cambio porcentual (simulado por ahora)
      const result = topProducts.map((p, index) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        sales: Number(p.sales),
        change: Math.floor(Math.random() * 30) - 5,
        revenue: Number(p.revenue)
      }));

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Error en getTopProducts:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener ticket medio del período
   * GET /api/dashboard/average-ticket?period=week
   */
  async getAverageTicket(req: Request, res: Response) {
    try {
      const period = (req.query.period as string) || 'week';
      
      const now = new Date();
      let startDate: Date;
      
      switch(period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      const saleRepo = AppDataSource.getRepository(Sale);
      
      const sales = await saleRepo.find({
        where: {
          createdAt: MoreThan(startDate),
          saleStatus: 'completed'
        }
      });

      const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const average = sales.length > 0 ? totalSales / sales.length : 0;

      res.json({
        success: true,
        data: { average }
      });

    } catch (error: any) {
      console.error('Error en getAverageTicket:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener conteo de productos con stock bajo
   * GET /api/dashboard/low-stock?threshold=10
   */
  async getLowStockCount(req: Request, res: Response) {
    try {
      const threshold = Number(req.query.threshold) || 10;
      
      const productRepo = AppDataSource.getRepository(Product);
      
      const count = await productRepo.count({
        where: {
          stock: LessThan(threshold),
          active: true
        }
      });

      res.json({
        success: true,
        data: { count }
      });

    } catch (error: any) {
      console.error('Error en getLowStockCount:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener resumen rápido (mejor hora, top producto, top cliente)
   * GET /api/dashboard/quick-summary
   */
  async getQuickSummary(req: Request, res: Response) {
    try {
      const saleRepo = AppDataSource.getRepository(Sale);
      const saleItemRepo = AppDataSource.getRepository(SaleItem);
      
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      
      // Mejor hora del día (basado en ventas de hoy)
      const hourlySales = await saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.sale', 'sale')
        .select('EXTRACT(HOUR FROM sale.createdAt)', 'hour')
        .addSelect('SUM(item.total)', 'value')
        .where('sale.createdAt > :startOfDay', { startOfDay })
        .andWhere('sale.saleStatus = :status', { status: 'completed' })
        .groupBy('EXTRACT(HOUR FROM sale.createdAt)')
        .orderBy('value', 'DESC')
        .limit(1)
        .getRawMany();

      const bestHour = hourlySales.length > 0 
        ? { hour: `${Number(hourlySales[0].hour)}:00`, value: Number(hourlySales[0].value) }
        : { hour: '12:00', value: 0 };

      // Top producto de la semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const topProductData = await saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.product', 'product')
        .leftJoin('item.sale', 'sale')
        .select('product.name', 'name')
        .addSelect('SUM(item.quantity)', 'sales')
        .where('sale.createdAt > :weekAgo', { weekAgo })
        .andWhere('sale.saleStatus = :status', { status: 'completed' })
        .groupBy('product.name')
        .orderBy('SUM(item.quantity)', 'DESC')
        .limit(1)
        .getRawMany();

      const topProduct = topProductData.length > 0
        ? { name: topProductData[0].name, sales: Number(topProductData[0].sales) }
        : { name: 'Ninguno', sales: 0 };

      // Top cliente del mes
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      const topCustomerData = await saleRepo
        .createQueryBuilder('sale')
        .leftJoin('sale.client', 'client')
        .select("CONCAT(client.firstName, ' ', client.lastName)", 'name')
        .addSelect('SUM(sale.total)', 'total')
        .where('sale.createdAt > :monthAgo', { monthAgo })
        .andWhere('sale.saleStatus = :status', { status: 'completed' })
        .andWhere('client.id IS NOT NULL')
        .groupBy('client.id')
        .addGroupBy('client.firstName')
        .addGroupBy('client.lastName')
        .orderBy('SUM(sale.total)', 'DESC')
        .limit(1)
        .getRawMany();

      const topCustomer = topCustomerData.length > 0
        ? { name: topCustomerData[0].name, total: Number(topCustomerData[0].total) }
        : { name: 'Cliente no registrado', total: 0 };

      res.json({
        success: true,
        data: {
          bestHour,
          topProduct,
          topCustomer
        }
      });

    } catch (error: any) {
      console.error('Error en getQuickSummary:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const dashboardController = new DashboardController();
import { Request, Response } from 'express';
import { prisma } from '../server';

export class DashboardController {
  
  async getKPIs(req: Request, res: Response) {
    try {
      const { period = 'today' } = req.query;
      
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

      // Ventas del período actual
      const currentPeriodSales = await prisma.sales.findMany({
        where: {
          created_at: { gte: startDate },
          sale_status: 'completed'
        }
      });

      // Ventas del período anterior
      const periodLength = now.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodLength);
      
      const previousPeriodSales = await prisma.sales.findMany({
        where: {
          created_at: { gte: previousStartDate, lt: startDate },
          sale_status: 'completed'
        }
      });

      const todaySales = currentPeriodSales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const previousTotal = previousPeriodSales.reduce((sum, sale) => sum + Number(sale.total), 0);
      
      const averageTicket = currentPeriodSales.length > 0 
        ? todaySales / currentPeriodSales.length 
        : 0;

      const lowStockCount = await prisma.products.count({
        where: {
          stock: { lt: 10 },
          active: true
        }
      });

      const growth = previousTotal > 0 
        ? ((todaySales - previousTotal) / previousTotal) * 100 
        : 0;

      const saleItems = await prisma.sale_items.findMany({
        where: {
          sale: {
            created_at: { gte: startDate },
            sale_status: 'completed'
          }
        }
      });

      const totalProfit = saleItems.reduce((sum, item) => sum + Number(item.margin || 0), 0);
      const averageMargin = todaySales > 0 ? (totalProfit / todaySales) * 100 : 0;

      const pendingOrders = await prisma.sales.count({
        where: {
          payment_status: 'pending',
          sale_status: 'completed'
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

  async getHourlySales(req: Request, res: Response) {
    try {
      const { date } = req.query;
      
      let targetDate = date ? new Date(date as string) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const hourlyData = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          SUM(total) as value
        FROM sales
        WHERE created_at BETWEEN ${targetDate} AND ${nextDay}
          AND sale_status = 'completed'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour ASC
      `;

      const hours = Array.from({ length: 24 }, (_, i) => i);
      const result = hours.map(hour => {
        const found = (hourlyData as any[]).find((d: any) => Number(d.hour) === hour);
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

  async getComparativeData(req: Request, res: Response) {
    try {
      const now = new Date();
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      
      const previousWeekStart = new Date(weekStart);
      previousWeekStart.setDate(weekStart.getDate() - 7);

      const currentWeekSales = await prisma.$queryRaw`
        SELECT 
          EXTRACT(DOW FROM created_at) as dayOfWeek,
          SUM(total) as total
        FROM sales
        WHERE created_at BETWEEN ${weekStart} AND ${now}
          AND sale_status = 'completed'
        GROUP BY EXTRACT(DOW FROM created_at)
      `;

      const previousWeekSales = await prisma.$queryRaw`
        SELECT 
          EXTRACT(DOW FROM created_at) as dayOfWeek,
          SUM(total) as total
        FROM sales
        WHERE created_at BETWEEN ${previousWeekStart} AND ${weekStart}
          AND sale_status = 'completed'
        GROUP BY EXTRACT(DOW FROM created_at)
      `;

      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      const result = [];
      for (let i = 1; i <= 7; i++) {
        const dayIndex = i % 7;
        const currentDay = (currentWeekSales as any[]).find((d: any) => Number(d.dayOfWeek) === dayIndex);
        const previousDay = (previousWeekSales as any[]).find((d: any) => Number(d.dayOfWeek) === dayIndex);
        
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
        case 'quarter':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      const topProducts = await prisma.sale_items.groupBy({
        by: ['product_id'],
        where: {
          sale: {
            created_at: { gte: startDate },
            sale_status: 'completed'
          }
        },
        _sum: {
          quantity: true,
          total: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: limit
      });

      const result = await Promise.all(
        topProducts.map(async (item) => {
          const product = await prisma.products.findUnique({
            where: { id: item.product_id }
          });

          // Obtener los items de venta para este producto en el período
          const saleItems = await prisma.sale_items.findMany({
            where: {
              product_id: item.product_id,
              sale: {
                created_at: { gte: startDate },
                sale_status: 'completed'
              }
            }
          });

          // Calcular margen total y porcentaje
          const totalMargin = saleItems.reduce((sum, si) => sum + Number(si.margin || 0), 0);
          const totalRevenue = Number(item._sum.total || 0);
          const marginPercentage = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

          return {
            id: item.product_id,
            name: product?.name || 'Unknown',
            category: product?.category || 'N/A',
            quantity: item._sum.quantity || 0,
            revenue: totalRevenue,
            margin: totalMargin,
            marginPercentage: Number(marginPercentage.toFixed(1))
          };
        })
      );

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

      const sales = await prisma.sales.findMany({
        where: {
          created_at: { gte: startDate },
          sale_status: 'completed'
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

  async getLowStockCount(req: Request, res: Response) {
    try {
      const threshold = Number(req.query.threshold) || 10;
      
      const count = await prisma.products.count({
        where: {
          stock: { lt: threshold },
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

  async getQuickSummary(req: Request, res: Response) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      
      // Mejor hora del día
      const hourlySales = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          SUM(total) as value
        FROM sales
        WHERE created_at > ${startOfDay}
          AND sale_status = 'completed'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY value DESC
        LIMIT 1
      `;

      const bestHourData = (hourlySales as any[])[0];
      const bestHour = bestHourData
        ? { hour: `${Number(bestHourData.hour)}:00`, value: Number(bestHourData.value) }
        : { hour: '12:00', value: 0 };

      // Top producto de la semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const topProductData = await prisma.sale_items.groupBy({
        by: ['product_id'],
        where: {
          sale: {
            created_at: { gte: weekAgo },
            sale_status: 'completed'
          }
        },
        _sum: {
          quantity: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 1
      });

      let topProduct = { name: 'Ninguno', sale: 0 };
      
      if (topProductData.length > 0) {
        const product = await prisma.products.findUnique({
          where: { id: topProductData[0].product_id }
        });
        topProduct = {
          name: product?.name || 'Unknown',
          sale: topProductData[0]._sum.quantity || 0
        };
      }

      // Top cliente del mes
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      const topCustomerData = await prisma.sales.groupBy({
        by: ['client_id'],
        where: {
          created_at: { gte: monthAgo },
          sale_status: 'completed',
          client_id: { not: null }
        },
        _sum: {
          total: true
        },
        orderBy: {
          _sum: {
            total: 'desc'
          }
        },
        take: 1
      });

      let topCustomer = { name: 'Cliente no registrado', total: 0 };
      
      if (topCustomerData.length > 0 && topCustomerData[0].client_id) {
        const client = await prisma.clients.findUnique({
          where: { id: topCustomerData[0].client_id }
        });
        topCustomer = {
          name: client ? `${client.first_name} ${client.last_name}` : 'Cliente no registrado',
          total: Number(topCustomerData[0]._sum.total || 0)
        };
      }

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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const server_1 = require("../server");
const client_1 = require("@prisma/client");
class DashboardController {
    // Dashboard principal con filtro multi-tenant
    async getDashboard(req, res) {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
            if (isSuperAdmin) {
                // Dashboard global para SUPER_ADMIN
                const totalPharmacies = await server_1.prisma.pharmacy.count();
                const totalUsers = await server_1.prisma.users.count();
                const totalSales = await server_1.prisma.sales.aggregate({
                    _sum: { total: true }
                });
                // Ventas por farmacia
                const salesByPharmacy = await server_1.prisma.sales.groupBy({
                    by: ['pharmacy_id'],
                    _sum: { total: true },
                    _count: true,
                    orderBy: {
                        _sum: {
                            total: 'desc'
                        }
                    },
                    take: 10
                });
                // Obtener nombres de farmacias
                const pharmacyIds = salesByPharmacy.map(s => s.pharmacy_id).filter(id => id !== null);
                const pharmacies = await server_1.prisma.pharmacy.findMany({
                    where: { id: { in: pharmacyIds } },
                    select: { id: true, name: true }
                });
                const pharmacyMap = new Map(pharmacies.map(p => [p.id, p.name]));
                const enrichedSalesByPharmacy = salesByPharmacy.map(sale => ({
                    pharmacy_id: sale.pharmacy_id,
                    pharmacy_name: sale.pharmacy_id ? pharmacyMap.get(sale.pharmacy_id) : 'Desconocido',
                    total_sales: sale._sum.total || 0,
                    transaction_count: sale._count
                }));
                return res.json({
                    success: true,
                    data: {
                        total_pharmacies: totalPharmacies,
                        total_users: totalUsers,
                        total_sales: totalSales._sum.total || 0,
                        sales_by_pharmacy: enrichedSalesByPharmacy,
                        is_global: true
                    }
                });
            }
            // Dashboard de farmacia para ADMIN y EMPLOYEE
            if (!pharmacyFilter.pharmacy_id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes una farmacia asignada'
                });
            }
            const stats = await server_1.prisma.sales.aggregate({
                where: pharmacyFilter,
                _sum: { total: true },
                _count: true
            });
            // Stock bajo
            const lowStock = await server_1.prisma.inventory_lots.count({
                where: {
                    ...pharmacyFilter,
                    quantity: { lt: 10 },
                    expiry_date: { gt: new Date() }
                }
            });
            // Productos próximos a vencer
            const expiringProducts = await server_1.prisma.inventory_lots.findMany({
                where: {
                    ...pharmacyFilter,
                    expiry_date: {
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
                        gt: new Date()
                    }
                },
                include: {
                    products: {
                        select: { name: true }
                    }
                },
                orderBy: { expiry_date: 'asc' },
                take: 5
            });
            // Ventas recientes
            const recentSales = await server_1.prisma.sales.findMany({
                where: pharmacyFilter,
                take: 10,
                orderBy: { created_at: 'desc' },
                include: {
                    clients: true,
                    users: {
                        select: { full_name: true }
                    }
                }
            });
            // Clientes más frecuentes
            const topClients = await server_1.prisma.sales.groupBy({
                by: ['client_id'],
                where: {
                    ...pharmacyFilter,
                    client_id: { not: null }
                },
                _sum: { total: true },
                _count: true,
                orderBy: {
                    _sum: {
                        total: 'desc'
                    }
                },
                take: 5
            });
            const clientIds = topClients.map(c => c.client_id).filter(id => id !== null);
            const clients = await server_1.prisma.clients.findMany({
                where: { id: { in: clientIds } },
                select: { id: true, first_name: true, last_name: true }
            });
            const clientMap = new Map(clients.map(c => [c.id, c]));
            const enrichedTopClients = topClients.map(client => {
                const clientData = client.client_id ? clientMap.get(client.client_id) : null;
                return {
                    client_id: client.client_id,
                    client_name: clientData ? `${clientData.first_name} ${clientData.last_name}` : 'Cliente no registrado',
                    total_spent: client._sum.total || 0,
                    purchase_count: client._count
                };
            });
            res.json({
                success: true,
                data: {
                    total_sales: stats._sum.total || 0,
                    total_transactions: stats._count,
                    low_stock_alerts: lowStock,
                    expiring_products: expiringProducts.map(p => ({
                        products_name: p.products.name,
                        batch_number: p.batch_number,
                        expiry_date: p.expiry_date,
                        quantity: p.quantity
                    })),
                    recent_sales: recentSales.map(sale => ({
                        id: sale.id,
                        sale_number: sale.sale_number,
                        total: sale.total,
                        clients_name: sale.clients ? `${sale.clients.first_name} ${sale.clients.last_name}` : 'Cliente no registrado',
                        users_name: sale.users?.full_name || 'Usuario',
                        created_at: sale.created_at
                    })),
                    top_clients: enrichedTopClients,
                    is_global: false
                }
            });
        }
        catch (error) {
            console.error('Error en getDashboard:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getKPIs(req, res) {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const { period = 'today' } = req.query;
            const now = new Date();
            let startDate;
            switch (period) {
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
            const currentPeriodSales = await server_1.prisma.sales.findMany({
                where: {
                    ...pharmacyFilter,
                    created_at: { gte: startDate },
                    sale_status: 'completed'
                }
            });
            // Ventas del período anterior
            const periodLength = now.getTime() - startDate.getTime();
            const previousStartDate = new Date(startDate.getTime() - periodLength);
            const previousPeriodSales = await server_1.prisma.sales.findMany({
                where: {
                    ...pharmacyFilter,
                    created_at: { gte: previousStartDate, lt: startDate },
                    sale_status: 'completed'
                }
            });
            const todaySales = currentPeriodSales.reduce((sum, sale) => sum + Number(sale.total), 0);
            const previousTotal = previousPeriodSales.reduce((sum, sale) => sum + Number(sale.total), 0);
            const averageTicket = currentPeriodSales.length > 0
                ? todaySales / currentPeriodSales.length
                : 0;
            const lowStockCount = await server_1.prisma.inventory_lots.count({
                where: {
                    ...pharmacyFilter,
                    quantity: { lt: 10 },
                    expiry_date: { gt: new Date() }
                }
            });
            const growth = previousTotal > 0
                ? ((todaySales - previousTotal) / previousTotal) * 100
                : 0;
            const saleItems = await server_1.prisma.sale_items.findMany({
                where: {
                    sales: {
                        ...pharmacyFilter,
                        created_at: { gte: startDate },
                        sale_status: 'completed'
                    }
                }
            });
            const totalProfit = saleItems.reduce((sum, item) => sum + Number(item.margin || 0), 0);
            const averageMargin = todaySales > 0 ? (totalProfit / todaySales) * 100 : 0;
            const pendingOrders = await server_1.prisma.sales.count({
                where: {
                    ...pharmacyFilter,
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
        }
        catch (error) {
            console.error('Error en getKPIs:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getHourlySales(req, res) {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const { date } = req.query;
            let targetDate = date ? new Date(date) : new Date();
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            // Construir la consulta correctamente con Prisma raw
            const query = client_1.Prisma.sql `
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          SUM(total) as value
        FROM sales
        WHERE created_at BETWEEN ${targetDate} AND ${nextDay}
          AND sale_status = 'completed'
          ${pharmacyFilter.pharmacy_id ? client_1.Prisma.sql `AND pharmacy_id = ${pharmacyFilter.pharmacy_id}` : client_1.Prisma.empty}
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour ASC
      `;
            const hourlyData = await server_1.prisma.$queryRaw(query);
            const hours = Array.from({ length: 24 }, (_, i) => i);
            const result = hours.map(hour => {
                const found = hourlyData.find((d) => Number(d.hour) === hour);
                return {
                    hour: `${hour}:00`,
                    value: found ? Number(found.value) : 0
                };
            });
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error en getHourlySales:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getComparativeData(req, res) {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 7);
            const previousWeekStart = new Date(weekStart);
            previousWeekStart.setDate(weekStart.getDate() - 7);
            const currentWeekQuery = client_1.Prisma.sql `
        SELECT 
          EXTRACT(DOW FROM created_at) as dayOfWeek,
          SUM(total) as total
        FROM sales
        WHERE created_at BETWEEN ${weekStart} AND ${now}
          AND sale_status = 'completed'
          ${pharmacyFilter.pharmacy_id ? client_1.Prisma.sql `AND pharmacy_id = ${pharmacyFilter.pharmacy_id}` : client_1.Prisma.empty}
        GROUP BY EXTRACT(DOW FROM created_at)
      `;
            const previousWeekQuery = client_1.Prisma.sql `
        SELECT 
          EXTRACT(DOW FROM created_at) as dayOfWeek,
          SUM(total) as total
        FROM sales
        WHERE created_at BETWEEN ${previousWeekStart} AND ${weekStart}
          AND sale_status = 'completed'
          ${pharmacyFilter.pharmacy_id ? client_1.Prisma.sql `AND pharmacy_id = ${pharmacyFilter.pharmacy_id}` : client_1.Prisma.empty}
        GROUP BY EXTRACT(DOW FROM created_at)
      `;
            const currentWeekSales = await server_1.prisma.$queryRaw(currentWeekQuery);
            const previousWeekSales = await server_1.prisma.$queryRaw(previousWeekQuery);
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const result = [];
            for (let i = 1; i <= 7; i++) {
                const dayIndex = i % 7;
                const currentDay = currentWeekSales.find((d) => Number(d.dayofweek) === dayIndex);
                const previousDay = previousWeekSales.find((d) => Number(d.dayofweek) === dayIndex);
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
        }
        catch (error) {
            console.error('Error en getComparativeData:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getTopProducts(req, res) {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const limit = Number(req.query.limit) || 10;
            const period = req.query.period;
            const startDateParam = req.query.startDate;
            const endDateParam = req.query.endDate;
            let startDate;
            let endDate = new Date();
            // Si se proporcionan fechas personalizadas
            if (startDateParam && endDateParam) {
                startDate = new Date(startDateParam);
                endDate = new Date(endDateParam);
                endDate.setHours(23, 59, 59, 999);
            }
            else {
                // Usar período predefinido
                const now = new Date();
                switch (period) {
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
            }
            const topProducts = await server_1.prisma.sale_items.groupBy({
                by: ['product_id'],
                where: {
                    sales: {
                        ...pharmacyFilter,
                        created_at: {
                            gte: startDate,
                            lte: endDate
                        },
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
            const result = await Promise.all(topProducts.map(async (item) => {
                const product = await server_1.prisma.products.findUnique({
                    where: { id: item.product_id }
                });
                // Obtener los items de venta para este producto en el período
                const saleItems = await server_1.prisma.sale_items.findMany({
                    where: {
                        product_id: item.product_id,
                        sales: {
                            ...pharmacyFilter,
                            created_at: {
                                gte: startDate,
                                lte: endDate
                            },
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
            }));
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error en getTopProducts:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getAverageTicket(req, res) {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const period = req.query.period || 'week';
            const now = new Date();
            let startDate;
            switch (period) {
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
            const sales = await server_1.prisma.sales.findMany({
                where: {
                    ...pharmacyFilter,
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
        }
        catch (error) {
            console.error('Error en getAverageTicket:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getLowStockCount(req, res) {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const threshold = Number(req.query.threshold) || 10;
            const count = await server_1.prisma.inventory_lots.count({
                where: {
                    ...pharmacyFilter,
                    quantity: { lt: threshold },
                    expiry_date: { gt: new Date() }
                }
            });
            res.json({
                success: true,
                data: { count }
            });
        }
        catch (error) {
            console.error('Error en getLowStockCount:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getQuickSummary(req, res) {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const now = new Date();
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            // Mejor hora del día
            const bestHourQuery = client_1.Prisma.sql `
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          SUM(total) as value
        FROM sales
        WHERE created_at > ${startOfDay}
          AND sale_status = 'completed'
          ${pharmacyFilter.pharmacy_id ? client_1.Prisma.sql `AND pharmacy_id = ${pharmacyFilter.pharmacy_id}` : client_1.Prisma.empty}
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY value DESC
        LIMIT 1
      `;
            const hourlySales = await server_1.prisma.$queryRaw(bestHourQuery);
            const bestHourData = hourlySales[0];
            const bestHour = bestHourData
                ? { hour: `${Number(bestHourData.hour)}:00`, value: Number(bestHourData.value) }
                : { hour: '12:00', value: 0 };
            // Top producto de la semana
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const topProductData = await server_1.prisma.sale_items.groupBy({
                by: ['product_id'],
                where: {
                    sale: {
                        ...pharmacyFilter,
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
                const product = await server_1.prisma.products.findUnique({
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
            const topCustomerData = await server_1.prisma.sales.groupBy({
                by: ['client_id'],
                where: {
                    ...pharmacyFilter,
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
                const client = await server_1.prisma.clients.findUnique({
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
        }
        catch (error) {
            console.error('Error en getQuickSummary:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    // Nuevo método para obtener estadísticas de stock
    async getStockStats(req, res) {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const totalProducts = await server_1.prisma.inventory_lots.aggregate({
                where: pharmacyFilter,
                _sum: { quantity: true }
            });
            const lowStock = await server_1.prisma.inventory_lots.count({
                where: {
                    ...pharmacyFilter,
                    quantity: { lt: 10 },
                    expiry_date: { gt: new Date() }
                }
            });
            const expiringThisMonth = await server_1.prisma.inventory_lots.count({
                where: {
                    ...pharmacyFilter,
                    expiry_date: {
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        gt: new Date()
                    }
                }
            });
            const expired = await server_1.prisma.inventory_lots.count({
                where: {
                    ...pharmacyFilter,
                    expiry_date: { lt: new Date() },
                    quantity: { gt: 0 }
                }
            });
            res.json({
                success: true,
                data: {
                    total_units: totalProducts._sum.quantity || 0,
                    low_stock_items: lowStock,
                    expiring_items: expiringThisMonth,
                    expired_items: expired
                }
            });
        }
        catch (error) {
            console.error('Error en getStockStats:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();

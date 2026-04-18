"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = void 0;
const server_1 = require("../server");
exports.inventoryController = {
    // Obtener todo el inventario
    getAll: async (req, res) => {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            // Obtener parámetros de paginación
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            // Obtener total de registros
            const total = await server_1.prisma.inventory_lots.count({
                where: pharmacyFilter
            });
            // Obtener registros paginados
            const inventory = await server_1.prisma.inventory_lots.findMany({
                where: pharmacyFilter,
                include: {
                    products: true
                },
                orderBy: { expiry_date: 'asc' },
                skip: skip,
                take: limit
            });
            res.json({
                success: true,
                data: inventory,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Obtener lotes de inventario
    getLots: async (req, res) => {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const { productId } = req.query;
            const where = { ...pharmacyFilter };
            if (productId) {
                where.product_id = parseInt(productId);
            }
            const lots = await server_1.prisma.inventory_lots.findMany({
                where,
                include: {
                    products: true,
                    stock_movements: {
                        take: 5,
                        orderBy: { created_at: 'desc' }
                    }
                },
                orderBy: { expiry_date: 'asc' }
            });
            res.json({ success: true, data: lots });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Obtener resumen del inventario
    getSummary: async (req, res) => {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            // Total de productos (lotes únicos por producto)
            const totalProducts = await server_1.prisma.inventory_lots.groupBy({
                by: ['product_id'],
                where: pharmacyFilter,
                _count: {
                    product_id: true
                }
            });
            // Stock total
            const totalStock = await server_1.prisma.inventory_lots.aggregate({
                where: pharmacyFilter,
                _sum: { quantity: true }
            });
            // Productos con stock bajo (< 10)
            const lowStock = await server_1.prisma.inventory_lots.count({
                where: {
                    ...pharmacyFilter,
                    quantity: { lt: 10 }
                }
            });
            // Productos por vencer (próximos 30 días)
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const expiringSoon = await server_1.prisma.inventory_lots.count({
                where: {
                    ...pharmacyFilter,
                    expiry_date: { lte: thirtyDaysFromNow, gt: new Date() }
                }
            });
            // Productos vencidos
            const expired = await server_1.prisma.inventory_lots.count({
                where: {
                    ...pharmacyFilter,
                    expiry_date: { lt: new Date() }
                }
            });
            // Valor total del inventario (aproximado)
            const inventoryValue = await server_1.prisma.inventory_lots.findMany({
                where: pharmacyFilter,
                include: {
                    products: {
                        select: { pricePPH: true }
                    }
                }
            });
            const totalValue = inventoryValue.reduce((sum, lot) => {
                const price = Number(lot.products?.pricePPH ?? 0);
                return sum + (lot.quantity * price);
            }, 0);
            res.json({
                success: true,
                data: {
                    total_products: totalProducts.length,
                    total_stock: totalStock._sum.quantity || 0,
                    low_stock: lowStock,
                    expiring_soon: expiringSoon,
                    expired: expired,
                    total_value: totalValue
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Crear nuevo lote
    createLot: async (req, res) => {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const { product_id, batch_number, expiry_date, quantity } = req.body;
            const pharmacyId = pharmacyFilter.pharmacy_id;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
            }
            const lot = await server_1.prisma.inventory_lots.create({
                data: {
                    product_id,
                    pharmacy_id: pharmacyId,
                    batch_number,
                    expiry_date: new Date(expiry_date),
                    quantity
                }
            });
            // Registrar movimiento de stock
            await server_1.prisma.stock_movements.create({
                data: {
                    product_id,
                    pharmacy_id: pharmacyId,
                    type: 'IN',
                    quantity,
                    stock_after: quantity,
                    notes: `Lote creado: ${batch_number}`,
                    user_id: req.user?.id
                }
            });
            res.status(201).json({ success: true, data: lot });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Actualizar lote
    updateLot: async (req, res) => {
        try {
            const { id } = req.params;
            const pharmacyFilter = req.pharmacyFilter || {};
            const { batch_number, expiry_date, quantity } = req.body;
            const lot = await server_1.prisma.inventory_lots.update({
                where: {
                    id: parseInt(id),
                    ...pharmacyFilter
                },
                data: {
                    batch_number,
                    expiry_date: expiry_date ? new Date(expiry_date) : undefined,
                    quantity
                }
            });
            res.json({ success: true, data: lot });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Eliminar lote
    deleteLot: async (req, res) => {
        try {
            const { id } = req.params;
            const pharmacyFilter = req.pharmacyFilter || {};
            await server_1.prisma.inventory_lots.delete({
                where: {
                    id: parseInt(id),
                    ...pharmacyFilter
                }
            });
            res.json({ success: true, message: 'Lote eliminado correctamente' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Ajuste de inventario
    adjustInventory: async (req, res) => {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const { product_id, new_quantity, reason } = req.body;
            const pharmacyId = pharmacyFilter.pharmacy_id;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
            }
            // Actualizar stock
            const lot = await server_1.prisma.inventory_lots.updateMany({
                where: {
                    product_id,
                    pharmacy_id: pharmacyId
                },
                data: {
                    quantity: new_quantity
                }
            });
            // Registrar ajuste
            await server_1.prisma.stock_movements.create({
                data: {
                    product_id,
                    pharmacy_id: pharmacyId,
                    type: 'ADJUSTMENT',
                    quantity: new_quantity,
                    stock_after: new_quantity,
                    notes: `Ajuste manual: ${reason}`,
                    user_id: req.user?.id
                }
            });
            res.json({ success: true, message: 'Inventario ajustado correctamente' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Obtener alertas de inventario
    getAlerts: async (req, res) => {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const lowStock = await server_1.prisma.inventory_lots.findMany({
                where: {
                    ...pharmacyFilter,
                    quantity: { lt: 10 }
                },
                include: { products: true }
            });
            const expiring = await server_1.prisma.inventory_lots.findMany({
                where: {
                    ...pharmacyFilter,
                    expiry_date: { lte: thirtyDaysFromNow }
                },
                include: { products: true }
            });
            res.json({
                success: true,
                data: {
                    low_stock: lowStock,
                    expiring: expiring,
                    total_alerts: lowStock.length + expiring.length
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

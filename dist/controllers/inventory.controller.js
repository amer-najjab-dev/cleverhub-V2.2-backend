"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = void 0;
const server_1 = require("../server");
exports.inventoryController = {
    // Obtener todo el inventario
    getAll: async (req, res) => {
        try {
            const pharmacyFilter = req.pharmacyFilter || {};
            const inventory = await server_1.prisma.inventory_lots.findMany({
                where: pharmacyFilter,
                include: {
                    product: true
                },
                orderBy: { expiry_date: 'asc' }
            });
            res.json({ success: true, data: inventory });
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
                    product: true,
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
                include: { product: true }
            });
            const expiring = await server_1.prisma.inventory_lots.findMany({
                where: {
                    ...pharmacyFilter,
                    expiry_date: { lte: thirtyDaysFromNow }
                },
                include: { product: true }
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

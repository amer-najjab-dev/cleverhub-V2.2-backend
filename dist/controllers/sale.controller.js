"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleController = exports.VentaController = void 0;
const server_1 = require("../server");
class VentaController {
    async crear(req, res) {
        console.log('Payload recibido:', JSON.stringify(req.body, null, 2));
        try {
            const { userId, clientId, paymentMethod, items } = req.body;
            if (!userId || !items) {
                return res.status(400).json({ error: 'Faltan datos: userId, items' });
            }
            // Calcular total
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const total = subtotal; // Por ahora sin impuestos
            // Crear venta con Prisma
            const venta = await server_1.prisma.sales.create({
                data: {
                    sale_number: `V-${Date.now()}`,
                    user_id: userId,
                    client_id: clientId,
                    subtotal,
                    total,
                    paid_amount: total,
                    payment_method: paymentMethod,
                    payment_status: 'paid',
                    sale_status: 'completed',
                    sale_items: {
                        create: items.map((item) => ({
                            product_id: item.productId,
                            quantity: item.quantity,
                            unit_price_ppv: item.price,
                            unit_price_pph: 0, // Habría que calcularlo
                            subtotal: item.price * item.quantity,
                            total: item.price * item.quantity,
                            margin: 0
                        }))
                    }
                },
                include: {
                    sale_items: true,
                    client: true,
                    user: true
                }
            });
            res.status(201).json({
                success: true,
                data: venta
            });
        }
        catch (error) {
            console.error('Error detallado:', error);
            console.error('Stack trace:', error.stack);
            res.status(500).json({ error: error.message });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const id = parseInt(req.params.id);
            const venta = await server_1.prisma.sales.findUnique({
                where: { id },
                include: {
                    sale_items: {
                        include: {
                            product: true
                        }
                    },
                    client: true,
                    user: true
                }
            });
            if (!venta) {
                return res.status(404).json({ error: 'Venta no encontrada' });
            }
            res.json({
                success: true,
                data: venta
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async listar(req, res) {
        try {
            const { startDate, endDate, clientId, userId, saleStatus, paymentStatus, paymentMethod, limit = 50, offset = 0 } = req.query;
            const where = {};
            if (startDate && endDate) {
                where.created_at = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            if (clientId)
                where.client_id = parseInt(clientId);
            if (userId)
                where.user_id = parseInt(userId);
            if (saleStatus)
                where.sale_status = saleStatus;
            if (paymentStatus)
                where.payment_status = paymentStatus;
            if (paymentMethod)
                where.payment_method = paymentMethod;
            const ventas = await server_1.prisma.sales.findMany({
                where,
                include: {
                    client: true,
                    user: true,
                    sale_items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: Number(limit),
                skip: Number(offset)
            });
            const total = await server_1.prisma.sales.count({ where });
            res.json({
                success: true,
                data: ventas,
                meta: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset)
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.VentaController = VentaController;
exports.saleController = new VentaController();

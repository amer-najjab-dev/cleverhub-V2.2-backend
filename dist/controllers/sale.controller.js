"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleController = exports.VentaController = void 0;
const server_1 = require("../server");
class VentaController {
    async crear(req, res) {
        console.log('Payload recibido:', JSON.stringify(req.body, null, 2));
        try {
            const { userId, clientId, paymentMethod, items, subtotal, total, paidAmount } = req.body;
            if (!userId || !items || !items.length) {
                return res.status(400).json({ error: 'Faltan datos: userId, items' });
            }
            // Calcular total si no viene, o usar el que viene
            let calculatedSubtotal = subtotal || 0;
            let calculatedTotal = total || 0;
            // Si no vienen calculados, calcularlos
            if (!calculatedSubtotal) {
                calculatedSubtotal = items.reduce((sum, item) => {
                    // Intentar con diferentes nombres de campo
                    const price = item.price || item.unit_price_ppv || item.unitPricePPV || 0;
                    return sum + (price * item.quantity);
                }, 0);
            }
            if (!calculatedTotal) {
                calculatedTotal = calculatedSubtotal; // Sin impuestos por ahora
            }
            // Crear venta con Prisma
            const venta = await server_1.prisma.sales.create({
                data: {
                    sale_number: `V-${Date.now()}`,
                    user_id: userId,
                    client_id: clientId,
                    subtotal: calculatedSubtotal,
                    total: calculatedTotal,
                    paid_amount: paidAmount || calculatedTotal,
                    payment_method: paymentMethod || 'cash',
                    payment_status: 'paid',
                    sale_status: 'completed',
                    sale_items: {
                        create: items.map((item) => {
                            // Obtener precio del item (manejar diferentes nombres)
                            const pricePPV = item.price || item.unit_price_ppv || item.unitPricePPV || 0;
                            const pricePPH = item.unit_price_pph || item.unitPricePPH || 0;
                            return {
                                product_id: item.productId,
                                quantity: item.quantity,
                                unit_price_ppv: pricePPV,
                                unit_price_pph: pricePPH,
                                subtotal: pricePPV * item.quantity,
                                total: pricePPV * item.quantity,
                                margin: (pricePPV - pricePPH) * item.quantity
                            };
                        })
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

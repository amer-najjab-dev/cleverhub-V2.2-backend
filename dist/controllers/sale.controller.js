"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleController = exports.VentaController = void 0;
const venta_service_1 = require("../services/venta/venta.service");
const sale_dto_1 = require("../dtos/sale.dto");
class VentaController {
    async crear(req, res) {
        console.log('Payload recibido:', JSON.stringify(req.body, null, 2));
        try {
            const { userId, clientId, paymentMethod, items } = req.body;
            if (!userId || !items) {
                return res.status(400).json({ error: 'Faltan datos: userId, items' });
            }
            const saleData = new sale_dto_1.CreateSaleDTO(req.body);
            // YA NO PASAMOS REGIÓN - El frontend ya calcula el IVA
            const venta = await venta_service_1.ventaService.crearVenta(saleData);
            res.status(201).json(venta);
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
            const venta = await venta_service_1.ventaService.getVentaPorId(id);
            if (!venta)
                return res.status(404).json({ error: 'Venta no encontrada' });
            res.json(venta);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async listar(req, res) {
        try {
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                clientId: req.query.clientId ? parseInt(req.query.clientId) : undefined,
                userId: req.query.userId ? parseInt(req.query.userId) : undefined,
                saleStatus: req.query.saleStatus,
                paymentStatus: req.query.paymentStatus,
                paymentMethod: req.query.paymentMethod,
                limit: req.query.limit ? parseInt(req.query.limit) : 50,
                offset: req.query.offset ? parseInt(req.query.offset) : 0,
            };
            // Obtener ventas con relaciones de cliente y usuario
            const ventas = await venta_service_1.ventaService.getVentas(filters);
            // Devolver en el formato esperado por el frontend
            res.json({
                success: true,
                data: ventas
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

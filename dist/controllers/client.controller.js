"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientController = exports.ClienteController = void 0;
const cliente_service_1 = require("../services/cliente/cliente.service");
const venta_service_1 = require("../services/venta/venta.service");
const data_source_1 = require("../data-source");
const ClientDebt_1 = require("../entities/ClientDebt");
class ClienteController {
    async listar(req, res) {
        try {
            const clientes = await cliente_service_1.clienteService.listarTodos();
            res.json(clientes);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const id = parseInt(req.params.id);
            const cliente = await cliente_service_1.clienteService.obtenerPorId(id);
            if (!cliente)
                return res.status(404).json({ error: 'Cliente no encontrado' });
            res.json(cliente);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async crear(req, res) {
        try {
            const cliente = await cliente_service_1.clienteService.crear(req.body);
            res.status(201).json(cliente);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async actualizar(req, res) {
        try {
            const id = parseInt(req.params.id);
            const cliente = await cliente_service_1.clienteService.actualizar(id, req.body);
            if (!cliente)
                return res.status(404).json({ error: 'Cliente no encontrado' });
            res.json(cliente);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async eliminar(req, res) {
        try {
            const id = parseInt(req.params.id);
            await cliente_service_1.clienteService.eliminar(id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // ===== NUEVOS ENDPOINTS =====
    async obtenerDeuda(req, res) {
        try {
            const clientId = parseInt(req.params.clientId);
            const deuda = await data_source_1.AppDataSource.getRepository(ClientDebt_1.ClientDebt).findOne({ where: { clientId } });
            if (!deuda) {
                return res.json({ totalDebt: 0, paidAmount: 0, pendingAmount: 0, status: 'paid' });
            }
            res.json(deuda);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async obtenerHealthRecords(req, res) {
        try {
            // Por ahora devolvemos un array vacío (puedes implementar luego)
            res.json([]);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async obtenerHealthStats(req, res) {
        try {
            // Devuelve un objeto con lastRecord null
            res.json({ lastRecord: null });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async obtenerCompras(req, res) {
        try {
            const clientId = parseInt(req.params.clientId);
            if (isNaN(clientId)) {
                return res.status(400).json({ error: 'ID de cliente inválido' });
            }
            const compras = await venta_service_1.ventaService.getVentasPorCliente(clientId);
            res.json({ success: true, data: compras });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.ClienteController = ClienteController;
exports.clientController = new ClienteController();

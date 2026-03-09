"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.PagoController = void 0;
const pago_service_1 = require("../services/pago/pago.service");
class PagoController {
    async procesarPago(req, res) {
        try {
            const clientId = parseInt(req.params.clientId);
            const { amount, paymentMethod, reference, notes } = req.body;
            if (!clientId || !amount || !paymentMethod) {
                return res.status(400).json({ error: 'Faltan datos: clientId, amount, paymentMethod' });
            }
            const resultado = await pago_service_1.pagoService.procesarPago(clientId, amount, { paymentMethod, reference, notes });
            res.json(resultado);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.PagoController = PagoController;
exports.paymentController = new PagoController();

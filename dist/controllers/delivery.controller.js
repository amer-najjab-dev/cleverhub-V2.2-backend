"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryController = void 0;
const delivery_service_1 = require("../services/delivery.service");
exports.deliveryController = {
    async registerDelivery(req, res) {
        try {
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            // CONVERTIR TODAS LAS FECHAS
            const convertedData = {
                ...req.body,
                reception_date: new Date(req.body.reception_date),
                due_date: req.body.due_date ? new Date(req.body.due_date) : undefined,
                items: req.body.items.map((item) => ({
                    ...item,
                    expiration_date: item.expiration_date ? new Date(item.expiration_date) : undefined
                })),
                received_by: req.user?.id,
                pharmacy_id: pharmacyId
            };
            const result = await delivery_service_1.deliveryService.registerDelivery(convertedData);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Albarán registrado correctamente'
            });
        }
        catch (error) {
            console.error('Error registering delivery:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    async registerObligationPayment(req, res) {
        try {
            const result = await delivery_service_1.deliveryService.registerObligationPayment(req.body);
            res.json({
                success: true,
                data: result,
                message: 'Pago registrado correctamente'
            });
        }
        catch (error) {
            console.error('Error registering payment:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    async getSupplierObligations(req, res) {
        try {
            const { supplierId } = req.params;
            const obligations = await delivery_service_1.deliveryService.getSupplierObligations(supplierId); // ← no usar parseInt
            res.json({ success: true, data: obligations });
        }
        catch (error) {
            console.error('Error getting obligations:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

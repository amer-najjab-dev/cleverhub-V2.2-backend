"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Procesar pago - usando el nombre exacto del método
router.post('/clients/:clientId/payments', payment_controller_1.paymentController.procesarPago.bind(payment_controller_1.paymentController));
exports.default = router;

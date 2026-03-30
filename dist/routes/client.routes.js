"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Permitir OPTIONS sin autenticación para CORS
router.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Region, Cookie');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});
// Aplicar autenticación solo para las rutas, no para OPTIONS
router.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }
    (0, auth_1.requireAuth)(req, res, next);
});
// Rutas básicas de clientes
router.get('/', (req, res) => client_controller_1.clientController.getAll(req, res));
router.get('/:id', (req, res) => client_controller_1.clientController.getById(req, res));
router.post('/', (req, res) => client_controller_1.clientController.create(req, res));
router.put('/:id', (req, res) => client_controller_1.clientController.update(req, res));
router.delete('/:id', (req, res) => client_controller_1.clientController.delete(req, res));
router.get('/:id/can-delete', client_controller_1.clientController.checkCanDelete);
// Rutas de loyalty
router.get('/:id/loyalty', (req, res) => client_controller_1.clientController.getLoyaltyPoints(req, res));
// Rutas de deudas
router.get('/:id/debts', (req, res) => client_controller_1.clientController.getDebts(req, res));
router.get('/:clientId/purchases', (req, res) => client_controller_1.clientController.getClientPurchases(req, res));
// Rutas de pagos de deuda
router.post('/:clientId/debt/payments', (req, res) => client_controller_1.clientController.registerDebtPayment(req, res));
router.get('/:clientId/debt/pending', (req, res) => client_controller_1.clientController.getPendingAmount(req, res));
// ===== HEALTH RECORDS =====
router.get('/:clientId/health-records', (req, res) => client_controller_1.clientController.getHealthRecords(req, res));
router.post('/:clientId/health-records', (req, res) => client_controller_1.clientController.createHealthRecord(req, res));
router.get('/:clientId/health-stats', (req, res) => client_controller_1.clientController.getHealthStats(req, res));
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Rutas básicas de clientes
router.get('/', (req, res) => client_controller_1.clientController.getAll(req, res));
router.get('/:id', (req, res) => client_controller_1.clientController.getById(req, res));
router.post('/', (req, res) => client_controller_1.clientController.create(req, res));
router.put('/:id', (req, res) => client_controller_1.clientController.update(req, res));
router.delete('/:id', (req, res) => client_controller_1.clientController.delete(req, res));
// Rutas de loyalty
router.get('/:id/loyalty', (req, res) => client_controller_1.clientController.getLoyaltyPoints(req, res));
// Rutas de deudas
router.get('/:id/debts', (req, res) => client_controller_1.clientController.getDebts(req, res));
// ===== HEALTH RECORDS =====
router.get('/:clientId/health-records', (req, res) => client_controller_1.clientController.getHealthRecords(req, res));
router.post('/:clientId/health-records', (req, res) => client_controller_1.clientController.createHealthRecord(req, res));
router.get('/:clientId/health-stats', (req, res) => client_controller_1.clientController.getHealthStats(req, res));
exports.default = router;

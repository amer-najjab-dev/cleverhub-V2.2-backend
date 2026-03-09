"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Rutas de clientes - usando los nombres exactos de los métodos
router.get('/', client_controller_1.clientController.listar.bind(client_controller_1.clientController));
router.get('/search', client_controller_1.clientController.listar.bind(client_controller_1.clientController)); // Usa listar con parámetros de búsqueda
router.get('/:id', client_controller_1.clientController.obtenerPorId.bind(client_controller_1.clientController));
router.post('/', (0, auth_1.requireRole)(['admin']), client_controller_1.clientController.crear.bind(client_controller_1.clientController));
router.put('/:id', (0, auth_1.requireRole)(['admin']), client_controller_1.clientController.actualizar.bind(client_controller_1.clientController));
router.delete('/:id', (0, auth_1.requireRole)(['admin']), client_controller_1.clientController.eliminar.bind(client_controller_1.clientController));
// Deudas
router.get('/:clientId/debt', client_controller_1.clientController.obtenerDeuda.bind(client_controller_1.clientController));
// Salud
router.get('/:clientId/health-records', client_controller_1.clientController.obtenerHealthRecords.bind(client_controller_1.clientController));
router.get('/:clientId/health-stats', client_controller_1.clientController.obtenerHealthStats.bind(client_controller_1.clientController));
// Historial de compras
router.get('/:clientId/purchases', client_controller_1.clientController.obtenerCompras.bind(client_controller_1.clientController));
exports.default = router;

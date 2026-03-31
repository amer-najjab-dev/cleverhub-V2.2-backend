"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/stock.routes.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const stock_controller_1 = require("../controllers/stock.controller");
const router = (0, express_1.Router)();
// Todas las rutas requieren rol ADMIN
router.get('/', (0, auth_1.requireRole)(['ADMIN']), stock_controller_1.stockController.getAll);
router.get('/low-stock', (0, auth_1.requireRole)(['ADMIN']), stock_controller_1.stockController.getLowStock);
router.get('/expiring', (0, auth_1.requireRole)(['ADMIN']), stock_controller_1.stockController.getExpiringProducts);
router.get('/movements', (0, auth_1.requireRole)(['ADMIN']), stock_controller_1.stockController.getMovements);
router.post('/movements', (0, auth_1.requireRole)(['ADMIN']), stock_controller_1.stockController.createMovement);
router.get('/product/:productId', (0, auth_1.requireRole)(['ADMIN']), stock_controller_1.stockController.getByProduct);
router.put('/adjust/:id', (0, auth_1.requireRole)(['ADMIN']), stock_controller_1.stockController.adjustStock);
exports.default = router;

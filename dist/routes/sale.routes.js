"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sale_controller_1 = require("../controllers/sale.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Rutas de ventas - usando los nombres exactos de los métodos
router.post('/', sale_controller_1.saleController.crear.bind(sale_controller_1.saleController));
router.get('/', sale_controller_1.saleController.listar.bind(sale_controller_1.saleController));
router.get('/:id', sale_controller_1.saleController.obtenerPorId.bind(sale_controller_1.saleController));
exports.default = router;

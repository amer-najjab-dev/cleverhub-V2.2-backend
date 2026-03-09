"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Rutas de productos - usando los nombres exactos de los métodos
router.get('/', product_controller_1.productController.listar.bind(product_controller_1.productController));
router.get('/search', product_controller_1.productController.buscar.bind(product_controller_1.productController));
router.get('/:id', product_controller_1.productController.obtenerPorId.bind(product_controller_1.productController));
// Nota: No hay métodos crear, actualizar, eliminar en el controlador de productos
// Si necesitas estas funcionalidades, deberás implementarlas primero
// Historial de precios
router.get('/:id/price-history', product_controller_1.productController.getPriceHistory.bind(product_controller_1.productController));
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplier_controller_1 = require("../controllers/supplier.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.requireAuth);
// ========== CRUD PROVEEDORES ==========
router.get('/', supplier_controller_1.supplierController.getAll.bind(supplier_controller_1.supplierController));
router.get('/search', supplier_controller_1.supplierController.search.bind(supplier_controller_1.supplierController));
router.get('/:id', supplier_controller_1.supplierController.getById.bind(supplier_controller_1.supplierController));
router.post('/', (0, auth_1.requireRole)(['admin']), supplier_controller_1.supplierController.create.bind(supplier_controller_1.supplierController));
router.put('/:id', (0, auth_1.requireRole)(['admin']), supplier_controller_1.supplierController.update.bind(supplier_controller_1.supplierController));
router.delete('/:id', (0, auth_1.requireRole)(['admin']), supplier_controller_1.supplierController.delete.bind(supplier_controller_1.supplierController));
exports.default = router;

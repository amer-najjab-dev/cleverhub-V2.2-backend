"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("../controllers/inventory.controller");
const router = (0, express_1.Router)();
// Rutas de inventario
router.get('/', inventory_controller_1.inventoryController.getInventory.bind(inventory_controller_1.inventoryController));
router.get('/products/:id', inventory_controller_1.inventoryController.getProduct.bind(inventory_controller_1.inventoryController));
router.get('/expiry-alerts', inventory_controller_1.inventoryController.getExpiryAlerts.bind(inventory_controller_1.inventoryController));
router.get('/movements', inventory_controller_1.inventoryController.getStockMovements.bind(inventory_controller_1.inventoryController));
router.post('/adjust', inventory_controller_1.inventoryController.adjustStock.bind(inventory_controller_1.inventoryController));
router.get('/summary', inventory_controller_1.inventoryController.getSummary.bind(inventory_controller_1.inventoryController));
router.get('/scan/:barcode', inventory_controller_1.inventoryController.scanBarcode.bind(inventory_controller_1.inventoryController));
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loyaltyConfig_controller_1 = require("../controllers/loyaltyConfig.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Rutas de configuración de puntos
router.get('/', loyaltyConfig_controller_1.loyaltyConfigController.getConfig.bind(loyaltyConfig_controller_1.loyaltyConfigController));
router.put('/', loyaltyConfig_controller_1.loyaltyConfigController.updateConfig.bind(loyaltyConfig_controller_1.loyaltyConfigController));
router.get('/statistics', loyaltyConfig_controller_1.loyaltyConfigController.getStatistics.bind(loyaltyConfig_controller_1.loyaltyConfigController));
router.get('/simulate', loyaltyConfig_controller_1.loyaltyConfigController.simulatePoints.bind(loyaltyConfig_controller_1.loyaltyConfigController));
router.post('/reset', loyaltyConfig_controller_1.loyaltyConfigController.resetToDefault.bind(loyaltyConfig_controller_1.loyaltyConfigController));
exports.default = router;

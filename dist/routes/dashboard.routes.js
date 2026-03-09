"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
// Rutas del dashboard
router.get('/kpis', dashboard_controller_1.dashboardController.getKPIs.bind(dashboard_controller_1.dashboardController));
router.get('/hourly-sales', dashboard_controller_1.dashboardController.getHourlySales.bind(dashboard_controller_1.dashboardController));
router.get('/comparative', dashboard_controller_1.dashboardController.getComparativeData.bind(dashboard_controller_1.dashboardController));
router.get('/top-products', dashboard_controller_1.dashboardController.getTopProducts.bind(dashboard_controller_1.dashboardController));
router.get('/average-ticket', dashboard_controller_1.dashboardController.getAverageTicket.bind(dashboard_controller_1.dashboardController));
router.get('/low-stock', dashboard_controller_1.dashboardController.getLowStockCount.bind(dashboard_controller_1.dashboardController));
router.get('/quick-summary', dashboard_controller_1.dashboardController.getQuickSummary.bind(dashboard_controller_1.dashboardController));
exports.default = router;

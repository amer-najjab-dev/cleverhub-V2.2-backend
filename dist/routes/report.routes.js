"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// ========== CIERRE DE CAJA ==========
router.get('/cash-closure', report_controller_1.reportController.getCashClosure.bind(report_controller_1.reportController));
router.post('/cash-closure/validate', report_controller_1.reportController.validateClosure.bind(report_controller_1.reportController));
router.post('/cash-closure/resolve', report_controller_1.reportController.resolveDiscrepancy.bind(report_controller_1.reportController));
// ========== BUSINESS INTELLIGENCE ==========
router.get('/dashboard/kpis', report_controller_1.reportController.getDashboardKPIs.bind(report_controller_1.reportController));
router.get('/dashboard/sales-trend', report_controller_1.reportController.getSalesTrend.bind(report_controller_1.reportController));
router.get('/dashboard/top-products', report_controller_1.reportController.getTopProducts.bind(report_controller_1.reportController));
router.get('/dashboard/lost-sales', report_controller_1.reportController.getLostSales.bind(report_controller_1.reportController));
// ========== ANÁLISIS DE PROVEEDORES ==========
router.get('/suppliers/analysis', report_controller_1.reportController.getSupplierAnalysis.bind(report_controller_1.reportController));
router.get('/suppliers/:supplierId/purchases', report_controller_1.reportController.getSupplierPurchaseHistory.bind(report_controller_1.reportController));
router.get('/suppliers/:supplierId/credit-notes', report_controller_1.reportController.getSupplierCreditNotes.bind(report_controller_1.reportController));
exports.default = router;

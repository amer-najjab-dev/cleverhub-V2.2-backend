import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// ========== CIERRE DE CAJA ==========
router.get('/cash-closure', reportController.getCashClosure.bind(reportController));
router.post('/cash-closure/validate', reportController.validateClosure.bind(reportController));
router.post('/cash-closure/resolve', reportController.resolveDiscrepancy.bind(reportController));

// ========== BUSINESS INTELLIGENCE ==========
router.get('/dashboard/kpis', reportController.getDashboardKPIs.bind(reportController));
router.get('/dashboard/sales-trend', reportController.getSalesTrend.bind(reportController));
router.get('/dashboard/top-products', reportController.getTopProducts.bind(reportController));
router.get('/dashboard/lost-sales', reportController.getLostSales.bind(reportController));

// ========== ANÁLISIS DE PROVEEDORES ==========
router.get('/suppliers/analysis', reportController.getSupplierAnalysis.bind(reportController));
router.get('/suppliers/:supplierId/purchases', reportController.getSupplierPurchaseHistory.bind(reportController));
router.get('/suppliers/:supplierId/credit-notes', reportController.getSupplierCreditNotes.bind(reportController));

export default router;

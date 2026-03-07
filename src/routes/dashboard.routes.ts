import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

// Rutas del dashboard
router.get('/kpis', dashboardController.getKPIs.bind(dashboardController));
router.get('/hourly-sales', 
dashboardController.getHourlySales.bind(dashboardController));
router.get('/comparative', 
dashboardController.getComparativeData.bind(dashboardController));
router.get('/top-products', 
dashboardController.getTopProducts.bind(dashboardController));
router.get('/average-ticket', 
dashboardController.getAverageTicket.bind(dashboardController));
router.get('/low-stock', 
dashboardController.getLowStockCount.bind(dashboardController));
router.get('/quick-summary', 
dashboardController.getQuickSummary.bind(dashboardController));

export default router;

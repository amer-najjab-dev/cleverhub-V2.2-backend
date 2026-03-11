import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/kpis', dashboardController.getKPIs.bind(dashboardController));
router.get('/hourly-sales', 
dashboardController.getHourlySales.bind(dashboardController));
router.get('/comparative', 
dashboardController.getComparativeData.bind(dashboardController));
router.get('/top-products', 
dashboardController.getTopProducts.bind(dashboardController));

export default router;

// src/routes/superadmin.routes.ts
import { Router } from 'express';
import { requireRole } from '../middleware/rbac';
import { superAdminController } from '../controllers/superadmin.controller';

const router = Router();

// Todas las rutas requieren SUPER_ADMIN
router.use(requireRole(['SUPER_ADMIN']));

// Gestión de suscripciones
router.get('/subscriptions', superAdminController.getSubscriptions);
router.get('/subscriptions/:pharmacyId', superAdminController.getPharmacySubscription);
router.post('/subscriptions', superAdminController.createSubscription);
router.post('/subscriptions/renew', superAdminController.renewLicense);
router.post('/subscriptions/extend-courtesy', superAdminController.extendCourtesy);

// Comunicación
router.post('/broadcast', superAdminController.sendBroadcast);

// Health check
router.get('/health-status', superAdminController.getHealthStatus);

// Impersonate
router.post('/impersonate/:pharmacyId', superAdminController.impersonate);

export default router;

// src/routes/superadmin.routes.ts
import { Router } from 'express';
import { requireRole } from '../middleware/rbac';
import { superAdminController } from '../controllers/superadmin.controller';

const router = Router();

// Todas las rutas requieren SUPER_ADMIN
router.use(requireRole(['SUPER_ADMIN']));

// Gestión de suscripciones
router.get('/subscriptions', superAdminController.getsubscriptions);
router.get('/subscriptions/:pharmacyId', superAdminController.getPharmacysubscription);
router.post('/subscriptions', superAdminController.createsubscription);
router.post('/subscriptions/renew', superAdminController.renewLicense);
router.post('/subscriptions/extend-courtesy', superAdminController.extendCourtesy);

// Comunicación
router.post('/broadcast', superAdminController.sendBroadcast);

// Impersonate
router.post('/impersonate/:pharmacyId', superAdminController.impersonate);

export default router;

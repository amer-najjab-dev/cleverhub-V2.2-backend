"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/superadmin.routes.ts
const express_1 = require("express");
const rbac_1 = require("../middleware/rbac");
const superadmin_controller_1 = require("../controllers/superadmin.controller");
const router = (0, express_1.Router)();
// Todas las rutas requieren SUPER_ADMIN
router.use((0, rbac_1.requireRole)(['SUPER_ADMIN']));
// Gestión de suscripciones
router.get('/subscriptions', superadmin_controller_1.superAdminController.getSubscriptions);
router.get('/subscriptions/:pharmacyId', superadmin_controller_1.superAdminController.getPharmacySubscription);
router.post('/subscriptions', superadmin_controller_1.superAdminController.createSubscription);
router.post('/subscriptions/renew', superadmin_controller_1.superAdminController.renewLicense);
router.post('/subscriptions/extend-courtesy', superadmin_controller_1.superAdminController.extendCourtesy);
// Comunicación
router.post('/broadcast', superadmin_controller_1.superAdminController.sendBroadcast);
// Impersonate
router.post('/impersonate/:pharmacyId', superadmin_controller_1.superAdminController.impersonate);
exports.default = router;

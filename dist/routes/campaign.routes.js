"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/campaign.routes.ts
const express_1 = require("express");
const campaign_controller_1 = require("../controllers/campaign.controller");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Plantillas
router.get('/templates', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), campaign_controller_1.campaignController.getTemplates);
router.post('/templates', (0, rbac_1.requireRole)(['ADMIN']), campaign_controller_1.campaignController.createTemplate);
router.put('/templates/:id', (0, rbac_1.requireRole)(['ADMIN']), campaign_controller_1.campaignController.updateTemplate);
router.delete('/templates/:id', (0, rbac_1.requireRole)(['ADMIN']), campaign_controller_1.campaignController.deleteTemplate);
// Campañas
router.get('/', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), campaign_controller_1.campaignController.getCampaigns);
router.post('/', (0, rbac_1.requireRole)(['ADMIN']), campaign_controller_1.campaignController.createCampaign);
router.post('/:id/send', (0, rbac_1.requireRole)(['ADMIN']), campaign_controller_1.campaignController.sendCampaign);
router.get('/:id/stats', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), campaign_controller_1.campaignController.getCampaignStats);
router.get('/:id/recipients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), campaign_controller_1.campaignController.getCampaignRecipients);
router.delete('/:id', (0, rbac_1.requireRole)(['ADMIN']), campaign_controller_1.campaignController.deleteCampaign);
exports.default = router;

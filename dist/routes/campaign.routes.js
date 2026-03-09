"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/campaign.routes.ts
const express_1 = require("express");
const campaign_controller_1 = require("../controllers/campaign.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// ========== PLANTILLAS ==========
router.get('/templates', campaign_controller_1.campaignController.getTemplates.bind(campaign_controller_1.campaignController));
router.post('/templates', campaign_controller_1.campaignController.createTemplate.bind(campaign_controller_1.campaignController));
router.put('/templates/:id', campaign_controller_1.campaignController.updateTemplate.bind(campaign_controller_1.campaignController));
router.delete('/templates/:id', campaign_controller_1.campaignController.deleteTemplate.bind(campaign_controller_1.campaignController));
// ========== CAMPAÑAS ==========
router.get('/', campaign_controller_1.campaignController.getCampaigns.bind(campaign_controller_1.campaignController));
router.get('/:id', campaign_controller_1.campaignController.getCampaign.bind(campaign_controller_1.campaignController));
router.post('/', campaign_controller_1.campaignController.createCampaign.bind(campaign_controller_1.campaignController));
router.post('/:id/send', campaign_controller_1.campaignController.sendCampaign.bind(campaign_controller_1.campaignController));
// ========== SEGMENTACIÓN ==========
router.post('/preview', campaign_controller_1.campaignController.previewSegmentation.bind(campaign_controller_1.campaignController));
router.get('/dormant', campaign_controller_1.campaignController.getDormantClients.bind(campaign_controller_1.campaignController));
// ========== IA GENERADORA ==========
router.post('/ai/generate', campaign_controller_1.campaignController.generateAIMessages.bind(campaign_controller_1.campaignController));
router.post('/ai/like/:id', campaign_controller_1.campaignController.likeAIMessage.bind(campaign_controller_1.campaignController));
exports.default = router;

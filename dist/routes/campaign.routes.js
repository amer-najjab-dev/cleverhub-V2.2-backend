"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaign_controller_1 = require("../controllers/campaign.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Rutas de plantillas
router.get('/templates', (req, res) => campaign_controller_1.campaignController.getTemplates(req, res));
router.post('/templates', (req, res) => campaign_controller_1.campaignController.createTemplate(req, res));
// Rutas de campañas
router.get('/', (req, res) => campaign_controller_1.campaignController.getCampaigns(req, res));
router.post('/', (req, res) => campaign_controller_1.campaignController.createCampaign(req, res));
router.post('/:id/send', (req, res) => campaign_controller_1.campaignController.sendCampaign(req, res));
router.get('/:id/stats', (req, res) => campaign_controller_1.campaignController.getCampaignStats(req, res));
exports.default = router;

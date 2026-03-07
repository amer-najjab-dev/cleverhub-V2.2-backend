// backend/src/routes/campaign.routes.ts
import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// ========== PLANTILLAS ==========
router.get('/templates', campaignController.getTemplates.bind(campaignController));
router.post('/templates', campaignController.createTemplate.bind(campaignController));
router.put('/templates/:id', campaignController.updateTemplate.bind(campaignController));
router.delete('/templates/:id', campaignController.deleteTemplate.bind(campaignController));

// ========== CAMPAÑAS ==========
router.get('/', campaignController.getCampaigns.bind(campaignController));
router.get('/:id', campaignController.getCampaign.bind(campaignController));
router.post('/', campaignController.createCampaign.bind(campaignController));
router.post('/:id/send', campaignController.sendCampaign.bind(campaignController));

// ========== SEGMENTACIÓN ==========
router.post('/preview', campaignController.previewSegmentation.bind(campaignController));
router.get('/dormant', campaignController.getDormantClients.bind(campaignController));

// ========== IA GENERADORA ==========
router.post('/ai/generate', campaignController.generateAIMessages.bind(campaignController));
router.post('/ai/like/:id', campaignController.likeAIMessage.bind(campaignController));

export default router;
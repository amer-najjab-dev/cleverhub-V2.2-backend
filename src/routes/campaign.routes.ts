// src/routes/campaign.routes.ts
import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { requireRole } from '../middleware/auth';

const router = Router();

// Plantillas
router.get('/templates', requireRole(['ADMIN', 'EMPLOYEE']), campaignController.getTemplates);
router.post('/templates', requireRole(['ADMIN']), campaignController.createTemplate);
router.put('/templates/:id', requireRole(['ADMIN']), campaignController.updateTemplate);
router.delete('/templates/:id', requireRole(['ADMIN']), campaignController.deleteTemplate);

// Campañas
router.get('/', requireRole(['ADMIN', 'EMPLOYEE']), campaignController.getCampaigns);
router.post('/', requireRole(['ADMIN']), campaignController.createCampaign);
router.post('/:id/send', requireRole(['ADMIN']), campaignController.sendCampaign);
router.get('/:id/stats', requireRole(['ADMIN', 'EMPLOYEE']), campaignController.getCampaignStats);
router.get('/:id/recipients', requireRole(['ADMIN', 'EMPLOYEE']), campaignController.getCampaignRecipients);
router.delete('/:id', requireRole(['ADMIN']), campaignController.deleteCampaign);

export default router;
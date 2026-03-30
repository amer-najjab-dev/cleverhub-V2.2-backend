import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();
const campaignController = new CampaignController();

router.use(requireAuth);

// Rutas de plantillas
router.get('/templates', (req, res) => campaignController.getTemplates(req, res));
router.post('/templates', (req, res) => campaignController.createTemplate(req, res));

// Rutas de campañas
router.get('/', (req, res) => campaignController.getCampaigns(req, res));
router.post('/', (req, res) => campaignController.createCampaign(req, res));
router.post('/:id/send', (req, res) => campaignController.sendCampaign(req, res));
router.get('/:id/stats', (req, res) => campaignController.getCampaignStats(req, res));

export default router;

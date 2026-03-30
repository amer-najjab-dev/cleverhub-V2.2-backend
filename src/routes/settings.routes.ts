import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);
router.put('/change-password', settingsController.changePassword);
router.get('/pharmacy', settingsController.getPharmacySettings);
router.put('/pharmacy', settingsController.updatePharmacySettings);
router.get('/loyalty', settingsController.getLoyaltySettings);
router.put('/loyalty', settingsController.updateLoyaltySettings);

export default router;

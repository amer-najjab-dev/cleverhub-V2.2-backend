import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';

const router = Router();

router.get('/', inventoryController.getAll);
router.get('/lots', inventoryController.getLots);
router.post('/lots', inventoryController.createLot);
router.put('/lots/:id', inventoryController.updateLot);
router.delete('/lots/:id', inventoryController.deleteLot);
//router.post('/count', inventoryController.createCount);
//router.get('/counts', inventoryController.getCounts);
router.post('/adjust', inventoryController.adjustInventory);
router.get('/alerts', inventoryController.getAlerts);

export default router;

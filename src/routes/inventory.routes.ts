import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';

const router = Router();

// Rutas de inventario
router.get('/', inventoryController.getInventory.bind(inventoryController));
router.get('/products/:id', 
inventoryController.getProduct.bind(inventoryController));
router.get('/expiry-alerts', 
inventoryController.getExpiryAlerts.bind(inventoryController));
router.get('/movements', 
inventoryController.getStockMovements.bind(inventoryController));
router.post('/adjust', 
inventoryController.adjustStock.bind(inventoryController));
router.get('/summary', 
inventoryController.getSummary.bind(inventoryController));
router.get('/scan/:barcode', 
inventoryController.scanBarcode.bind(inventoryController));

export default router;

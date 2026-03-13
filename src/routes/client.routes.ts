import { Router } from 'express';
import { clientController } from '../controllers/client.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Rutas básicas de clientes
router.get('/', (req, res) => clientController.getAll(req, res));
router.get('/:id', (req, res) => clientController.getById(req, res));
router.post('/', (req, res) => clientController.create(req, res));
router.put('/:id', (req, res) => clientController.update(req, res));
router.delete('/:id', (req, res) => clientController.delete(req, res));

// Rutas de loyalty
router.get('/:id/loyalty', (req, res) => clientController.getLoyaltyPoints(req, res));

// Rutas de deudas
router.get('/:id/debts', (req, res) => clientController.getDebts(req, res));
router.get('/:clientId/purchases', (req, res) => clientController.getClientPurchases(req, res));

// ===== HEALTH RECORDS =====
router.get('/:clientId/health-records', (req, res) => clientController.getHealthRecords(req, res));
router.post('/:clientId/health-records', (req, res) => clientController.createHealthRecord(req, res));
router.get('/:clientId/health-stats', (req, res) => clientController.getHealthStats(req, res));

export default router;
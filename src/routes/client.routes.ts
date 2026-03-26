import { Router } from 'express';
import { clientController } from '../controllers/client.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Permitir OPTIONS sin autenticación para CORS
router.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Region, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Aplicar autenticación solo para las rutas, no para OPTIONS
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  requireAuth(req, res, next);
});

// Rutas básicas de clientes
router.get('/', (req, res) => clientController.getAll(req, res));
router.get('/:id', (req, res) => clientController.getById(req, res));
router.post('/', (req, res) => clientController.create(req, res));
router.put('/:id', (req, res) => clientController.update(req, res));
router.delete('/:id', (req, res) => clientController.delete(req, res));
router.get('/:id/can-delete', clientController.checkCanDelete);

// Rutas de loyalty
router.get('/:id/loyalty', (req, res) => clientController.getLoyaltyPoints(req, res));

// Rutas de deudas
router.get('/:id/debts', (req, res) => clientController.getDebts(req, res));
router.get('/:clientId/purchases', (req, res) => clientController.getClientPurchases(req, res));

// Rutas de pagos de deuda
router.post('/:clientId/debt/payments', (req, res) => clientController.registerDebtPayment(req, res));
router.get('/:clientId/debt/pending', (req, res) => clientController.getPendingAmount(req, res));

// ===== HEALTH RECORDS =====
router.get('/:clientId/health-records', (req, res) => clientController.getHealthRecords(req, res));
router.post('/:clientId/health-records', (req, res) => clientController.createHealthRecord(req, res));
router.get('/:clientId/health-stats', (req, res) => clientController.getHealthStats(req, res));

export default router;
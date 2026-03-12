import { Router } from 'express';
import { clientController } from '../controllers/client.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => clientController.getAll(req, res));
router.get('/:id', (req, res) => clientController.getById(req, res));
router.post('/', (req, res) => clientController.create(req, res));
router.put('/:id', (req, res) => clientController.update(req, res));
router.delete('/:id', (req, res) => clientController.delete(req, res));
router.get('/:id/loyalty', (req, res) => clientController.getLoyaltyPoints(req, res));
router.get('/:id/debts', (req, res) => clientController.getDebts(req, res));

export default router;

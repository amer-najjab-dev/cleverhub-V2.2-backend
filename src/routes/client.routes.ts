import { Router } from 'express';
import { clientController } from '../controllers/client.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Rutas de clientes - usando los nombres exactos de los métodos
router.get('/', clientController.listar.bind(clientController));
router.get('/search', clientController.listar.bind(clientController)); // Usa listar con parámetros de búsqueda
router.get('/:id', clientController.obtenerPorId.bind(clientController));
router.post('/', requireRole(['admin']), clientController.crear.bind(clientController));
router.put('/:id', requireRole(['admin']), clientController.actualizar.bind(clientController));
router.delete('/:id', requireRole(['admin']), clientController.eliminar.bind(clientController));

// Deudas
router.get('/:clientId/debt', clientController.obtenerDeuda.bind(clientController));

// Salud
router.get('/:clientId/health-records', clientController.obtenerHealthRecords.bind(clientController));
router.get('/:clientId/health-stats', clientController.obtenerHealthStats.bind(clientController));

// Historial de compras
router.get('/:clientId/purchases', clientController.obtenerCompras.bind(clientController));

export default router;
import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Rutas de productos - usando los nombres exactos de los métodos
router.get('/', productController.listar.bind(productController));
router.get('/search', productController.buscar.bind(productController));
router.get('/:id', productController.obtenerPorId.bind(productController));
// Nota: No hay métodos crear, actualizar, eliminar en el controlador de productos
// Si necesitas estas funcionalidades, deberás implementarlas primero

// Historial de precios
router.get('/:id/price-history', productController.getPriceHistory.bind(productController));

export default router;
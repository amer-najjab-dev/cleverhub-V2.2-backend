import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Rutas de usuarios (solo admin)
router.get('/', requireRole(['admin']), userController.getAll.bind(userController));
router.get('/:id', requireRole(['admin']), userController.getById.bind(userController));
router.post('/', requireRole(['admin']), userController.create.bind(userController));
router.put('/:id', requireRole(['admin']), userController.update.bind(userController));
router.delete('/:id', requireRole(['admin']), userController.delete.bind(userController));

// Ruta para actualizar perfil propio (cualquier usuario autenticado)
router.put('/profile/me', userController.updateProfile.bind(userController));

export default router;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.requireAuth);
// Rutas de usuarios (solo admin)
router.get('/', (0, auth_1.requireRole)(['admin']), user_controller_1.userController.getAll.bind(user_controller_1.userController));
router.get('/:id', (0, auth_1.requireRole)(['admin']), user_controller_1.userController.getById.bind(user_controller_1.userController));
router.post('/', (0, auth_1.requireRole)(['admin']), user_controller_1.userController.create.bind(user_controller_1.userController));
router.put('/:id', (0, auth_1.requireRole)(['admin']), user_controller_1.userController.update.bind(user_controller_1.userController));
router.delete('/:id', (0, auth_1.requireRole)(['admin']), user_controller_1.userController.delete.bind(user_controller_1.userController));
// Ruta para actualizar perfil propio (cualquier usuario autenticado)
router.put('/profile/me', user_controller_1.userController.updateProfile.bind(user_controller_1.userController));
exports.default = router;

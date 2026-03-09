"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const data_source_1 = require("../data-source");
const User_1 = require("../entities/User");
class UserController {
    // Obtener todos los usuarios (solo admin)
    async getAll(req, res) {
        try {
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const users = await userRepo.find({
                select: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt'],
                order: { createdAt: 'DESC' }
            });
            res.json({
                success: true,
                data: users
            });
        }
        catch (error) {
            console.error('Error getting users:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    // Obtener un usuario por ID
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepo.findOne({
                where: { id },
                select: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt']
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            res.json({
                success: true,
                data: user
            });
        }
        catch (error) {
            console.error('Error getting user:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    // Crear nuevo usuario (solo admin)
    async create(req, res) {
        try {
            const { email, password, fullName, role = 'employee', isActive = true } = req.body;
            // Validaciones
            if (!email || !password || !fullName) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, contraseña y nombre son obligatorios'
                });
            }
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            // Verificar si el email ya existe
            const existingUser = await userRepo.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }
            // Hashear contraseña
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            // Crear usuario
            const user = userRepo.create({
                email,
                password: hashedPassword,
                fullName,
                role,
                isActive
            });
            await userRepo.save(user);
            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    isActive: user.isActive
                }
            });
        }
        catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    // Actualizar usuario
    async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { email, fullName, role, isActive, password } = req.body;
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepo.findOne({ where: { id } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            // Si se proporciona nuevo email, verificar que no exista
            if (email && email !== user.email) {
                const existingUser = await userRepo.findOne({ where: { email } });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'El email ya está registrado por otro usuario'
                    });
                }
                user.email = email;
            }
            if (fullName)
                user.fullName = fullName;
            if (role)
                user.role = role;
            if (isActive !== undefined)
                user.isActive = isActive;
            // Si se proporciona nueva contraseña, hashearla
            if (password) {
                user.password = await bcrypt_1.default.hash(password, 10);
            }
            await userRepo.save(user);
            res.json({
                success: true,
                message: 'Usuario actualizado exitosamente',
                data: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    isActive: user.isActive
                }
            });
        }
        catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    // Eliminar usuario (solo admin)
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            // No permitir eliminar al propio usuario
            if (id === req.session.userId) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes eliminar tu propio usuario'
                });
            }
            const user = await userRepo.findOne({ where: { id } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            await userRepo.remove(user);
            res.json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        }
        catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    // Actualizar perfil propio
    async updateProfile(req, res) {
        try {
            const userId = req.session.userId;
            const { fullName, email, currentPassword, newPassword } = req.body;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'No autenticado'
                });
            }
            const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepo.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            // Verificar contraseña actual si se quiere cambiar la contraseña
            if (newPassword) {
                if (!currentPassword) {
                    return res.status(400).json({
                        success: false,
                        message: 'Debes proporcionar la contraseña actual'
                    });
                }
                const passwordValid = await bcrypt_1.default.compare(currentPassword, user.password);
                if (!passwordValid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Contraseña actual incorrecta'
                    });
                }
            }
            // Si se cambia el email, verificar que no exista
            if (email && email !== user.email) {
                const existingUser = await userRepo.findOne({ where: { email } });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'El email ya está registrado'
                    });
                }
                user.email = email;
            }
            if (fullName)
                user.fullName = fullName;
            if (newPassword) {
                user.password = await bcrypt_1.default.hash(newPassword, 10);
            }
            await userRepo.save(user);
            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                }
            });
        }
        catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const server_1 = require("../server");
const jwt_1 = require("../utils/jwt");
class AuthController {
    async register(req, res) {
        try {
            const { email, password, fullName, role = 'employee' } = req.body;
            if (!email || !password || !fullName) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, contraseña y nombre son obligatorios'
                });
            }
            const existingUser = await server_1.prisma.users.findUnique({
                where: { email }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            const user = await server_1.prisma.users.create({
                data: {
                    email,
                    password: hashedPassword,
                    full_name: fullName,
                    role,
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role
                }
            });
        }
        catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email y contraseña son obligatorios'
                });
            }
            const user = await server_1.prisma.users.findUnique({
                where: { email }
            });
            if (!user || !user.password) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            const passwordValid = await bcrypt_1.default.compare(password, user.password);
            if (!passwordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            // Generar token JWT
            const token = (0, jwt_1.generateToken)({
                id: user.id,
                email: user.email,
                role: user.role,
                pharmacyId: user.pharmacy_id
            });
            // Mantener sesión por cookie para compatibilidad
            req.session.userId = user.id;
            req.session.userRole = user.role || undefined;
            req.session.userEmail = user.email;
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve(true);
                });
            });
            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    pharmacyId: user.pharmacy_id
                },
                token
            });
        }
        catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al cerrar sesión'
                });
            }
            res.clearCookie('cleverhub.sid');
            res.json({
                success: true,
                message: 'Sesión cerrada exitosamente'
            });
        });
    }
    async me(req, res) {
        try {
            // Primero intentar con JWT
            const token = (0, jwt_1.extractToken)(req);
            let userId = null;
            if (token) {
                const payload = (0, jwt_1.verifyToken)(token);
                if (payload) {
                    userId = payload.id;
                }
            }
            // Fallback a sesión por cookie
            if (!userId && req.session.userId) {
                userId = req.session.userId;
            }
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'No autenticado'
                });
            }
            const user = await server_1.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                    role: true
                }
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role
                }
            });
        }
        catch (error) {
            console.error('Error en me:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();

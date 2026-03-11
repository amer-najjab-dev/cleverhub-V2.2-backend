"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const bcrypt = __importStar(require("bcrypt"));
const server_1 = require("../server");
class UserController {
    async getAll(req, res) {
        try {
            const users = await server_1.prisma.users.findMany({
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                    role: true,
                    is_active: true,
                    created_at: true
                    // last_login ELIMINADO - no existe en el modelo
                },
                orderBy: { created_at: 'desc' }
            });
            res.json({ success: true, data: users });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const user = await server_1.prisma.users.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                    role: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true
                }
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async create(req, res) {
        try {
            const { email, password, fullName, role = 'employee' } = req.body;
            const existingUser = await server_1.prisma.users.findUnique({
                where: { email }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await server_1.prisma.users.create({
                data: {
                    email,
                    password: hashedPassword,
                    full_name: fullName,
                    role,
                    is_active: true
                },
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                    role: true
                }
            });
            res.status(201).json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const { email, fullName, role, isActive } = req.body;
            const user = await server_1.prisma.users.update({
                where: { id: parseInt(id) },
                data: {
                    email,
                    full_name: fullName,
                    role,
                    is_active: isActive
                },
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                    role: true,
                    is_active: true
                }
            });
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await server_1.prisma.users.delete({ where: { id: parseInt(id) } });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateProfile(req, res) {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'No autenticado' });
            }
            const { fullName, email } = req.body;
            const user = await server_1.prisma.users.update({
                where: { id: userId },
                data: { full_name: fullName, email },
                select: { id: true, email: true, full_name: true, role: true }
            });
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();

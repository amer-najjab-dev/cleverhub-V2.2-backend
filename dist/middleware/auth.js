"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const server_1 = require("../server");
const jwt_1 = require("../utils/jwt");
const requireAuth = async (req, res, next) => {
    try {
        // Primero intentar con JWT
        const token = (0, jwt_1.extractToken)(req);
        if (token) {
            const payload = (0, jwt_1.verifyToken)(token);
            if (payload) {
                req.user = payload;
                return next();
            }
        }
        // Fallback a sesión por cookie (para compatibilidad)
        if (req.session.userId) {
            const user = await server_1.prisma.users.findUnique({
                where: { id: req.session.userId },
                select: { id: true, email: true, role: true, is_active: true }
            });
            if (user && user.is_active) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role || 'user'
                };
                return next();
            }
        }
        return res.status(401).json({
            success: false,
            message: 'No autenticado'
        });
    }
    catch (error) {
        console.error('Error en auth middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Error de autenticación'
        });
    }
};
exports.requireAuth = requireAuth;
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'No autenticado'
                });
            }
            if (!user.role || !roles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error de autorización'
            });
        }
    };
};
exports.requireRole = requireRole;

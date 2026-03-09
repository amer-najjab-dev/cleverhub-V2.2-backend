"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
// Middleware para requerir autenticación
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado'
        });
    }
    next();
};
exports.requireAuth = requireAuth;
// Middleware para requerir rol específico
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }
        const userRole = req.session.userRole;
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para esta acción'
            });
        }
        next();
    };
};
exports.requireRole = requireRole;

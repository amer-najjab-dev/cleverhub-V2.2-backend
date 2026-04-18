"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPharmacyFilter = exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }
        // NORMALIZAR A MAYÚSCULAS
        const userRole = req.user.role.toUpperCase();
        const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
        // SUPER_ADMIN siempre pasa
        if (userRole === 'SUPER_ADMIN') {
            return next();
        }
        // Comparación normalizada
        if (!normalizedAllowed.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `No autorizado. Se requiere uno de estos roles: ${allowedRoles.join(', ')}`
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Middleware para añadir filtro de farmacia automático
const addPharmacyFilter = (req, res, next) => {
    if (req.user && req.user.pharmacyId && req.user.role !== 'SUPER_ADMIN') {
        req.pharmacyFilter = { pharmacy_id: req.user.pharmacyId };
    }
    next();
}; // force deploy Jeu 16 avr 2026 18:00:30 +01
exports.addPharmacyFilter = addPharmacyFilter;

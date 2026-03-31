"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPharmacyFilter = exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'No autenticado'
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Rol ${req.user.role} no tiene permisos para 
esta acción`
            });
        }
        // Para ADMIN y EMPLOYEE, deben tener pharmacy_id
        if (req.user.role !== 'SUPER_ADMIN' && !req.user.pharmacyId) {
            return res.status(403).json({
                success: false,
                message: 'Usuario sin farmacia asignada. Contacte al administrador.'
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
};
exports.addPharmacyFilter = addPharmacyFilter;

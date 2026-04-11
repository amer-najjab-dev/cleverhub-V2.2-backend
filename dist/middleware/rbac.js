"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPharmacyFilter = exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        console.log('🔐 [requireRole] Iniciando...');
        console.log('🔐 [requireRole] req.user:', req.user);
        console.log('🔐 [requireRole] allowedRoles:', allowedRoles);
        if (!req.user) {
            console.log('❌ [requireRole] No hay usuario');
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }
        // Normalizar a minúsculas para comparación
        const userRole = req.user.role.toLowerCase();
        const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
        console.log('🔐 [requireRole] userRole (normalizado):', userRole);
        console.log('🔐 [requireRole] normalizedAllowed:', normalizedAllowed);
        if (!normalizedAllowed.includes(userRole)) {
            console.log(`❌ [requireRole] Rol ${req.user.role} no permitido`);
            return res.status(403).json({
                success: false,
                message: `No autorizado. Se requiere uno de estos roles: ${allowedRoles.join(', ')}`
            });
        }
        console.log('✅ [requireRole] Acceso permitido');
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

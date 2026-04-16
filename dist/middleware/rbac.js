"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPharmacyFilter = exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    // LOG CRÍTICO - Ver qué recibe la función
    console.log(`[RBAC DEBUG] ⚠️ requireRole INIT - allowedRoles recibido:`, allowedRoles);
    console.log(`[RBAC DEBUG] ⚠️ requireRole INIT - stack:`, new Error().stack);
    return (req, res, next) => {
        console.log(`🔐 [requireRole] ========== INICIO ==========`);
        console.log(`🔐 [requireRole] Ruta solicitada: ${req.method} ${req.originalUrl}`);
        console.log(`🔐 [requireRole] Path: ${req.path} | URL: ${req.url}`);
        console.log(`🔐 [requireRole] allowedRoles recibidos en ejecución:`, allowedRoles);
        console.log(`🔐 [requireRole] req.user:`, req.user);
        if (!req.user) {
            console.log('❌ [requireRole] No hay usuario');
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }
        // FUERZA EMPLOYEE para rutas de dashboard y sales
        let finalAllowedRoles = [...allowedRoles];
        if (req.url.includes('/dashboard') || req.url.includes('/sales')) {
            if (!finalAllowedRoles.includes('EMPLOYEE')) {
                finalAllowedRoles.push('EMPLOYEE');
                console.log(`[RBAC DEBUG] 🔧 FORZADO: Se añadió EMPLOYEE a ${req.url}`);
            }
        }
        const userRole = req.user.role.toLowerCase();
        const normalizedAllowed = finalAllowedRoles.map(r => r.toLowerCase());
        console.log(`🔐 [requireRole] userRole: ${userRole}`);
        console.log(`🔐 [requireRole] normalizedAllowed:`, normalizedAllowed);
        if (!normalizedAllowed.includes(userRole)) {
            console.log(`❌ [requireRole] Rol ${req.user.role} no permitido para la ruta ${req.originalUrl}`);
            console.log(`🔐 [requireRole] ========== FIN ==========`);
            return res.status(403).json({
                success: false,
                message: `No autorizado. Se requiere uno de estos roles: ${finalAllowedRoles.join(', ')}`
            });
        }
        console.log(`✅ [requireRole] Acceso permitido para ${req.originalUrl}`);
        console.log(`🔐 [requireRole] ========== FIN ==========`);
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

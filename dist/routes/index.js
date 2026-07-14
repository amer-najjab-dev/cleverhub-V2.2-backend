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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rbac_1 = require("../middleware/rbac");
const superadmin_controller_1 = require("../controllers/superadmin.controller");
const superadmin_controller_2 = require("../controllers/superadmin.controller");
// Importaciones de controladores
const pharmacy_controller_1 = require("../controllers/pharmacy.controller");
const user_controller_1 = require("../controllers/user.controller");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
// Importaciones de rutas existentes
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const product_routes_1 = __importDefault(require("./product.routes"));
const supplier_routes_1 = __importDefault(require("./supplier.routes"));
const report_routes_1 = __importDefault(require("./report.routes"));
const sale_routes_1 = __importDefault(require("./sale.routes"));
const client_routes_1 = __importDefault(require("./client.routes"));
const hr_routes_1 = __importDefault(require("./hr.routes"));
// Importaciones de rutas de IA y lealtad
const productIntelligence_routes_1 = __importDefault(require("./ai/productIntelligence.routes"));
const clientIntelligence_routes_1 = __importDefault(require("./ai/clientIntelligence.routes"));
const loyalty_routes_1 = __importDefault(require("./ai/loyalty.routes"));
const loyaltyReward_routes_1 = __importDefault(require("./loyaltyReward.routes"));
const loyaltyCheckout_routes_1 = __importDefault(require("./loyaltyCheckout.routes"));
const loyaltyConfig_routes_1 = __importDefault(require("./loyaltyConfig.routes"));
const campaign_routes_1 = __importDefault(require("./campaign.routes"));
// Importaciones de rutas adicionales
const stock_routes_1 = __importDefault(require("./stock.routes"));
const inventory_routes_1 = __importDefault(require("./inventory.routes"));
const settings_routes_1 = __importDefault(require("./settings.routes"));
const superadmin_routes_1 = __importDefault(require("./superadmin.routes"));
const delivery_routes_1 = __importDefault(require("./delivery.routes"));
const router = (0, express_1.Router)();
console.log('🔄 Cargando rutas con sistema RBAC multi-tenant...');
// ==========================================
// RUTAS PÚBLICAS (Sin autenticación)
// ==========================================
router.use('/auth', auth_routes_1.default);
router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// ==========================================
// RUTA PÚBLICA DEL CRON (sin autenticación)
// ==========================================
router.get('/admin/cron/check-expirations', async (req, res) => {
    try {
        const cronSecret = req.query.secret;
        const expectedSecret = process.env.CRON_SECRET;
        if (expectedSecret && cronSecret !== expectedSecret) {
            return res.status(401).json({
                success: false,
                message: 'Invalid cron secret'
            });
        }
        const result = await (0, superadmin_controller_2.checkExpirations)();
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in cron job:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ==========================================
// RUTAS SUPER_ADMIN (PRIMERO - más específicas)
// ==========================================
console.log('  📌 Cargando rutas SUPER_ADMIN...');
// Farmacias
router.get('/api/admin/pharmacies', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.getAll);
router.post('/api/admin/pharmacies', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.create);
router.put('/api/admin/pharmacies/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.update);
router.delete('/api/admin/pharmacies/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.delete);
// Usuarios globales
router.get('/api/admin/users', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.getAllUsers);
router.get('/api/admin/users/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.getUserById);
router.post('/api/admin/users', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.createUser);
router.put('/api/admin/users/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.updateUser);
router.delete('/api/admin/users/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.deleteUser);
// Suscripciones
router.get('/api/admin/subscriptions', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.getsubscriptions);
router.post('/api/admin/subscriptions', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.createsubscription);
router.post('/api/admin/subscriptions/extend-courtesy', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.extendCourtesy);
router.post('/api/admin/subscriptions/renew', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.renewLicense);
// Health status
router.get('/api/admin/health-status', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.getHealthStatus);
router.get('/api/super-admin/health', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.getHealthStatus);
// Broadcast
router.post('/api/admin/broadcast', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.sendBroadcast);
// Stats
router.get('/api/admin/stats', (0, rbac_1.requireRole)(['SUPER_ADMIN']), dashboard_controller_1.dashboardController.getStockStats);
// Logs de auditoría
router.get('/api/admin/logs', (0, rbac_1.requireRole)(['SUPER_ADMIN']), async (req, res) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../server')));
        const logs = await prisma.adminLog.findMany({
            include: {
                users: {
                    select: { id: true, email: true, full_name: true }
                }
            },
            orderBy: { created_at: 'desc' },
            take: 100
        });
        res.json({ success: true, data: logs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ==========================================
// RUTAS SUPER_ADMIN sin prefijo
// ==========================================
router.get('/admin/health-status', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.getHealthStatus);
router.use('/admin', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_routes_1.default);
// ==========================================
// RUTAS DASHBOARD - SOLO ADMIN (EMPLOYEE y AUXILIAR NO)
// ==========================================
console.log('  📌 Cargando rutas DASHBOARD...');
// Dashboard sin prefijo - SOLO ADMIN
router.get('/dashboard', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getDashboard);
router.get('/dashboard/kpis', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getKPIs);
router.get('/dashboard/hourly-sales', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getHourlySales);
router.get('/dashboard/comparative', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getComparativeData);
router.get('/dashboard/top-products', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getTopProducts);
router.get('/dashboard/average-ticket', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getAverageTicket);
router.get('/dashboard/low-stock', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getLowStockCount);
router.get('/dashboard/quick-summary', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getQuickSummary);
router.get('/dashboard/stock-stats', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getStockStats);
// Dashboard con prefijo /api - SOLO ADMIN
router.get('/api/dashboard/kpis', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getKPIs);
router.get('/api/dashboard/hourly-sales', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getHourlySales);
router.get('/api/dashboard/comparative', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getComparativeData);
router.get('/api/dashboard/top-products', (0, rbac_1.requireRole)(['ADMIN']), dashboard_controller_1.dashboardController.getTopProducts);
// ==========================================
// RUTAS ADMIN (exclusivas)
// ==========================================
console.log('  📌 Cargando rutas ADMIN...');
// Delivery routes
router.use('/api/delivery', (0, rbac_1.requireRole)(['ADMIN']), delivery_routes_1.default);
// Stock
router.use('/api/stock', (0, rbac_1.requireRole)(['ADMIN']), stock_routes_1.default);
router.use('/stock', (0, rbac_1.requireRole)(['ADMIN']), stock_routes_1.default);
// Inventario
router.use('/api/inventory', (0, rbac_1.requireRole)(['ADMIN']), inventory_routes_1.default);
router.use('/inventory', (0, rbac_1.requireRole)(['ADMIN']), inventory_routes_1.default);
// RRHH
router.use('/api/hr', (0, rbac_1.requireRole)(['ADMIN']), hr_routes_1.default);
router.use('/hr', (0, rbac_1.requireRole)(['ADMIN']), hr_routes_1.default);
// Loyalty (solo ADMIN)
router.use('/api/loyalty', (0, rbac_1.requireRole)(['ADMIN']), loyalty_routes_1.default);
router.use('/api/loyalty-rewards', (0, rbac_1.requireRole)(['ADMIN']), loyaltyReward_routes_1.default);
router.use('/api/loyalty-config', (0, rbac_1.requireRole)(['ADMIN']), loyaltyConfig_routes_1.default);
router.use('/loyalty', (0, rbac_1.requireRole)(['ADMIN']), loyalty_routes_1.default);
router.use('/loyalty-rewards', (0, rbac_1.requireRole)(['ADMIN']), loyaltyReward_routes_1.default);
router.use('/loyalty-config', (0, rbac_1.requireRole)(['ADMIN']), loyaltyConfig_routes_1.default);
// Loyalty-checkout (ADMIN y EMPLOYEE)
router.use('/api/loyalty-checkout', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), loyaltyCheckout_routes_1.default);
router.use('/loyalty-checkout', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), loyaltyCheckout_routes_1.default);
// Settings
router.use('/api/settings', (0, rbac_1.requireRole)(['ADMIN']), settings_routes_1.default);
router.use('/settings', (0, rbac_1.requireRole)(['ADMIN']), settings_routes_1.default);
// Reportes
router.use('/api/reports', (0, rbac_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), report_routes_1.default);
router.use('/reports', (0, rbac_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), report_routes_1.default);
// Usuarios
router.use('/api/users', (0, rbac_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), user_routes_1.default);
router.use('/users', (0, rbac_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), user_routes_1.default);
// Campañas
router.use('/api/campaigns', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), campaign_routes_1.default);
router.use('/campaigns', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), campaign_routes_1.default);
// IA
router.use('/api/ai/products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), productIntelligence_routes_1.default);
router.use('/api/ai/clients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), clientIntelligence_routes_1.default);
router.use('/api/ai/loyalty', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), loyalty_routes_1.default);
router.use('/ai/products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), productIntelligence_routes_1.default);
router.use('/ai/clients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), clientIntelligence_routes_1.default);
router.use('/ai/loyalty', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), loyalty_routes_1.default);
// ==========================================
// RUTAS EMPLOYEE (con sus permisos)
// ==========================================
console.log('  📌 Cargando rutas EMPLOYEE...');
// Ventas - EMPLOYEE
router.use('/api/sales', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), sale_routes_1.default);
router.use('/sales', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), sale_routes_1.default);
// Clientes - EMPLOYEE
router.use('/api/clients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), client_routes_1.default);
router.use('/clients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), client_routes_1.default);
// Productos - EMPLOYEE
router.use('/api/products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE', 'AUXILIAR']), product_routes_1.default);
router.use('/products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE', 'AUXILIAR']), product_routes_1.default);
// Proveedores - EMPLOYEE (SÍ tiene acceso)
router.use('/api/suppliers', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), supplier_routes_1.default);
router.use('/suppliers', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), supplier_routes_1.default);
// ==========================================
// RUTAS AUXILIAR (solo ventas y productos)
// ==========================================
console.log('  📌 Cargando rutas AUXILIAR...');
// Ventas - AUXILIAR
router.use('/api/sales', (0, rbac_1.requireRole)(['AUXILIAR']), sale_routes_1.default);
router.use('/sales', (0, rbac_1.requireRole)(['AUXILIAR']), sale_routes_1.default);
// Productos - AUXILIAR
router.use('/api/products', (0, rbac_1.requireRole)(['AUXILIAR']), product_routes_1.default);
router.use('/products', (0, rbac_1.requireRole)(['AUXILIAR']), product_routes_1.default);
// NOTA: AUXILIAR NO tiene acceso a clientes, proveedores, dashboard
console.log('✅ Todas las rutas cargadas correctamente con RBAC');
exports.default = router;

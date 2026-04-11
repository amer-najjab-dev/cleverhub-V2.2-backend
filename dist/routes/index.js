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
// src/routes/index.ts
const express_1 = require("express");
const rbac_1 = require("../middleware/rbac");
const superadmin_controller_1 = require("../controllers/superadmin.controller");
const superadmin_controller_2 = require("../controllers/superadmin.controller");
// Importaciones de controladores
const pharmacy_controller_1 = require("../controllers/pharmacy.controller");
const user_controller_1 = require("../controllers/user.controller");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const supplier_controller_1 = require("../controllers/supplier.controller");
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
// RUTAS CON PREFIJO /api (para compatibilidad con frontend)
// ==========================================
// Módulos
router.get('/api/modules', (0, rbac_1.requireRole)(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']), async (req, res) => {
    try {
        const userRole = req.user?.role;
        const modules = {
            SUPER_ADMIN: [
                { name: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
                { name: 'Farmacias', path: '/admin/pharmacies', icon: 'Store' },
                { name: 'Usuarios Globales', path: '/admin/users', icon: 'Users' },
                { name: 'Suscripciones', path: '/admin/subscriptions', icon: 'CreditCard' },
                { name: 'Comunicación', path: '/admin/broadcast', icon: 'Bell' },
                { name: 'Semáforo Salud', path: '/admin/health', icon: 'Activity' },
                { name: 'Configuración', path: '/settings', icon: 'Settings' }
            ],
            ADMIN: [
                { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
                { name: 'Ventas', path: '/sales', icon: 'ShoppingCart' },
                { name: 'Clientes', path: '/clients', icon: 'Users' },
                { name: 'Productos', path: '/products', icon: 'Package' },
                { name: 'Stock', path: '/stock', icon: 'Box' },
                { name: 'Proveedores', path: '/suppliers', icon: 'Truck' },
                { name: 'RRHH', path: '/hr', icon: 'Users' },
                { name: 'Reportes', path: '/reports', icon: 'FileText' }
            ],
            EMPLOYEE: [
                { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
                { name: 'Ventas', path: '/sales', icon: 'ShoppingCart' },
                { name: 'Clientes', path: '/clients', icon: 'Users' },
                { name: 'Productos', path: '/products', icon: 'Package' }
            ]
        };
        const availableModules = modules[userRole] || [];
        res.json({ success: true, data: availableModules });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Dashboard endpoints
router.get('/api/dashboard/kpis', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getKPIs);
router.get('/api/dashboard/hourly-sales', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getHourlySales);
router.get('/api/dashboard/comparative', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getComparativeData);
router.get('/api/dashboard/top-products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getTopProducts);
// ==========================================
// RUTAS SUPER_ADMIN CON PREFIJO /api
// ==========================================
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
router.get('/api/admin/subscriptions', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.getSubscriptions);
router.post('/api/admin/subscriptions', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.createSubscription);
router.post('/api/admin/subscriptions/extend-courtesy', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.extendCourtesy);
router.post('/api/admin/subscriptions/renew', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.renewLicense);
// Health status
router.get('/api/admin/health-status', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.getHealthStatus);
// Broadcast
router.post('/api/admin/broadcast', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.sendBroadcast);
// Stats (si se usa)
router.get('/api/admin/stats', (0, rbac_1.requireRole)(['SUPER_ADMIN']), dashboard_controller_1.dashboardController.getStockStats);
// Logs de auditoría
router.get('/api/admin/logs', (0, rbac_1.requireRole)(['SUPER_ADMIN']), async (req, res) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../server')));
        const logs = await prisma.adminLog.findMany({
            include: {
                admin: {
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
// RUTAS API CON PREFIJO /api - USAR RUTAS EXISTENTES
// ==========================================
// Ventas
router.use('/api/sales', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), sale_routes_1.default);
// Clientes
router.use('/api/clients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), client_routes_1.default);
// Productos
router.use('/api/products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), product_routes_1.default);
// Stock - Solo ADMIN
router.use('/api/stock', (0, rbac_1.requireRole)(['ADMIN']), stock_routes_1.default);
// Inventario - Solo ADMIN
router.use('/api/inventory', (0, rbac_1.requireRole)(['ADMIN']), inventory_routes_1.default);
// Proveedores - Solo ADMIN
router.use('/api/suppliers', (0, rbac_1.requireRole)(['ADMIN']), supplier_routes_1.default);
// RRHH - Solo ADMIN
router.use('/api/hr', (0, rbac_1.requireRole)(['ADMIN']), hr_routes_1.default);
// Reportes - ADMIN y SUPER_ADMIN
router.use('/api/reports', (0, rbac_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), report_routes_1.default);
// Configuración - Solo ADMIN
router.use('/api/loyalty', (0, rbac_1.requireRole)(['ADMIN']), loyalty_routes_1.default);
router.use('/api/loyalty-rewards', (0, rbac_1.requireRole)(['ADMIN']), loyaltyReward_routes_1.default);
router.use('/api/loyalty-checkout', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), loyaltyCheckout_routes_1.default);
router.use('/api/loyalty-config', (0, rbac_1.requireRole)(['ADMIN']), loyaltyConfig_routes_1.default);
router.use('/api/settings', (0, rbac_1.requireRole)(['ADMIN']), settings_routes_1.default);
// Campañas - ADMIN y EMPLOYEE
router.use('/api/campaigns', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), campaign_routes_1.default);
// IA - ADMIN y EMPLOYEE
router.use('/api/ai/products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), productIntelligence_routes_1.default);
router.use('/api/ai/clients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), clientIntelligence_routes_1.default);
router.use('/api/ai/loyalty', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), loyalty_routes_1.default);
// Usuarios - ADMIN y SUPER_ADMIN
router.use('/api/users', (0, rbac_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), user_routes_1.default);
// ==========================================
// RUTA PARA OBTENER MÓDULOS POR ROL (sin prefijo)
// ==========================================
router.get('/modules', (0, rbac_1.requireRole)(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']), async (req, res) => {
    try {
        const userRole = req.user?.role;
        const modules = {
            SUPER_ADMIN: [
                { name: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
                { name: 'Farmacias', path: '/admin/pharmacies', icon: 'Store' },
                { name: 'Suscripciones', path: '/admin/subscriptions', icon: 'CreditCard' },
                { name: 'Usuarios Globales', path: '/admin/users', icon: 'Users' },
                { name: 'Comunicación', path: '/admin/broadcast', icon: 'Bell' },
                { name: 'Semáforo Salud', path: '/admin/health', icon: 'Activity' },
                { name: 'Auditoría', path: '/admin/logs', icon: 'FileText' }
            ],
            ADMIN: [
                { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
                { name: 'Ventas', path: '/sales', icon: 'ShoppingCart' },
                { name: 'Clientes', path: '/clients', icon: 'Users' },
                { name: 'Productos', path: '/products', icon: 'Package' },
                { name: 'Stock', path: '/stock', icon: 'Box' },
                { name: 'Proveedores', path: '/suppliers', icon: 'Truck' },
                { name: 'RRHH', path: '/hr', icon: 'Users' },
                { name: 'Reportes', path: '/reports', icon: 'FileText' },
                { name: 'Configuración', path: '/settings', icon: 'Settings' }
            ],
            EMPLOYEE: [
                { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
                { name: 'Ventas', path: '/sales', icon: 'ShoppingCart' },
                { name: 'Clientes', path: '/clients', icon: 'Users' },
                { name: 'Productos', path: '/products', icon: 'Package' }
            ]
        };
        const availableModules = modules[userRole] || [];
        res.json({ success: true, data: availableModules });
    }
    catch (error) {
        console.error('Error getting modules:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ==========================================
// RUTAS SUPER_ADMIN (Protegidas) - sin prefijo
// ==========================================
console.log('  📌 Cargando rutas SUPER_ADMIN...');
// Rutas de gestión de farmacias
router.get('/admin/pharmacies', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.getAll);
router.post('/admin/pharmacies', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.create);
router.put('/admin/pharmacies/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.update);
router.delete('/admin/pharmacies/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.delete);
// Rutas de gestión de usuarios globales
router.get('/admin/users', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.getAllUsers);
router.get('/admin/users/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.getUserById);
router.post('/admin/users', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.createUser);
router.put('/admin/users/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.updateUser);
router.delete('/admin/users/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.deleteUser);
// Estadísticas globales
router.get('/admin/stats', (0, rbac_1.requireRole)(['SUPER_ADMIN']), dashboard_controller_1.dashboardController.getStockStats);
// Rutas de semáforo de salud
router.get('/admin/health-status', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_controller_1.superAdminController.getHealthStatus);
// Rutas de logs de auditoría
router.get('/admin/logs', (0, rbac_1.requireRole)(['SUPER_ADMIN']), async (req, res) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../server')));
        const logs = await prisma.adminLog.findMany({
            include: {
                admin: {
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
// Todas las rutas de superadmin (suscripciones, broadcast, impersonate)
router.use('/admin', (0, rbac_1.requireRole)(['SUPER_ADMIN']), superadmin_routes_1.default);
// ==========================================
// RUTAS DASHBOARD - ADMIN y EMPLOYEE (sin prefijo)
// ==========================================
console.log('  📌 Cargando rutas DASHBOARD...');
router.get('/dashboard', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getDashboard);
router.get('/dashboard/kpis', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getKPIs);
router.get('/dashboard/hourly-sales', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getHourlySales);
router.get('/dashboard/comparative', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getComparativeData);
router.get('/dashboard/top-products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getTopProducts);
router.get('/dashboard/average-ticket', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getAverageTicket);
router.get('/dashboard/low-stock', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getLowStockCount);
router.get('/dashboard/quick-summary', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getQuickSummary);
router.get('/dashboard/stock-stats', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getStockStats);
// ==========================================
// RUTAS SIN PREFIJO API (Compatibilidad) - SOLO ADMIN
// ==========================================
console.log('  📌 Cargando rutas sin prefijo (compatibilidad)...');
// Ventas
router.use('/sales', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), sale_routes_1.default);
// Clientes
router.use('/clients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), client_routes_1.default);
// Productos
router.use('/products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), product_routes_1.default);
// Proveedores - SOLO ADMIN
router.get('/suppliers', (0, rbac_1.requireRole)(['ADMIN']), supplier_controller_1.supplierController.getAll);
router.get('/suppliers/:id', (0, rbac_1.requireRole)(['ADMIN']), supplier_controller_1.supplierController.getById);
router.post('/suppliers', (0, rbac_1.requireRole)(['ADMIN']), supplier_controller_1.supplierController.create);
router.put('/suppliers/:id', (0, rbac_1.requireRole)(['ADMIN']), supplier_controller_1.supplierController.update);
router.delete('/suppliers/:id', (0, rbac_1.requireRole)(['ADMIN']), supplier_controller_1.supplierController.delete);
// Stock - Solo ADMIN
router.use('/stock', (0, rbac_1.requireRole)(['ADMIN']), stock_routes_1.default);
router.use('/inventory', (0, rbac_1.requireRole)(['ADMIN']), inventory_routes_1.default);
// RRHH - Solo ADMIN
router.use('/hr', (0, rbac_1.requireRole)(['ADMIN']), hr_routes_1.default);
// Reportes - ADMIN y SUPER_ADMIN
router.use('/reports', (0, rbac_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), report_routes_1.default);
// Configuración - Solo SUPER_ADMIN
router.use('/settings', (0, rbac_1.requireRole)(['SUPER_ADMIN']), settings_routes_1.default);
// Lealtad - ADMIN (configuración interna de la farmacia)
router.use('/loyalty', (0, rbac_1.requireRole)(['ADMIN']), loyalty_routes_1.default);
router.use('/loyalty-rewards', (0, rbac_1.requireRole)(['ADMIN']), loyaltyReward_routes_1.default);
router.use('/loyalty-checkout', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), loyaltyCheckout_routes_1.default);
router.use('/loyalty-config', (0, rbac_1.requireRole)(['ADMIN']), loyaltyConfig_routes_1.default);
// Campañas - ADMIN y EMPLOYEE
router.use('/campaigns', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), campaign_routes_1.default);
// IA - ADMIN y EMPLOYEE
router.use('/ai/products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), productIntelligence_routes_1.default);
router.use('/ai/clients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), clientIntelligence_routes_1.default);
router.use('/ai/loyalty', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), loyalty_routes_1.default);
// Usuarios - ADMIN y SUPER_ADMIN
router.use('/users', (0, rbac_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), user_routes_1.default);
console.log('✅ Todas las rutas cargadas correctamente con RBAC');
exports.default = router;

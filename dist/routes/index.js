"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/index.ts
const express_1 = require("express");
const rbac_1 = require("../middleware/rbac");
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
// RUTAS SUPER_ADMIN (Solo usuarios con rol SUPER_ADMIN)
// ==========================================
console.log('  📌 Cargando rutas SUPER_ADMIN...');
router.get('/admin/pharmacies', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.getAll);
router.post('/admin/pharmacies', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.create);
router.put('/admin/pharmacies/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.update);
router.delete('/admin/pharmacies/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), pharmacy_controller_1.pharmacyController.delete);
router.get('/admin/users', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.getAllUsers);
router.get('/admin/users/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.getUserById);
router.post('/admin/users', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.createUser);
router.put('/admin/users/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.updateUser);
router.delete('/admin/users/:id', (0, rbac_1.requireRole)(['SUPER_ADMIN']), user_controller_1.userController.deleteUser);
router.get('/admin/stats', (0, rbac_1.requireRole)(['SUPER_ADMIN']), dashboard_controller_1.dashboardController.getStockStats);
// ==========================================
// RUTAS DASHBOARD - ADMIN y EMPLOYEE
// ==========================================
console.log('  📌 Cargando rutas DASHBOARD...');
router.get('/dashboard', (0, rbac_1.requireRole)(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getDashboard);
router.get('/dashboard/kpis', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getKPIs);
router.get('/dashboard/hourly-sales', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getHourlySales);
router.get('/dashboard/comparative', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getComparativeData);
router.get('/dashboard/top-products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getTopProducts);
router.get('/dashboard/average-ticket', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getAverageTicket);
router.get('/dashboard/low-stock', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getLowStockCount);
router.get('/dashboard/quick-summary', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getQuickSummary);
router.get('/dashboard/stock-stats', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), dashboard_controller_1.dashboardController.getStockStats);
// ==========================================
// RUTAS API - ADMIN y EMPLOYEE
// ==========================================
console.log('  📌 Cargando rutas API...');
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
// Proveedores
router.use('/api/suppliers', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), supplier_routes_1.default);
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
// RUTAS SIN PREFIJO API (Compatibilidad)
// ==========================================
console.log('  📌 Cargando rutas sin prefijo (compatibilidad)...');
// Ventas
router.use('/sales', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), sale_routes_1.default);
// Clientes
router.use('/clients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), client_routes_1.default);
// Productos
router.use('/products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), product_routes_1.default);
// Proveedores (con endpoints específicos)
router.get('/suppliers', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), supplier_controller_1.supplierController.getAll);
router.get('/suppliers/:id', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), supplier_controller_1.supplierController.getById);
router.post('/suppliers', (0, rbac_1.requireRole)(['ADMIN']), supplier_controller_1.supplierController.create);
router.put('/suppliers/:id', (0, rbac_1.requireRole)(['ADMIN']), supplier_controller_1.supplierController.update);
router.delete('/suppliers/:id', (0, rbac_1.requireRole)(['ADMIN']), supplier_controller_1.supplierController.delete);
// Stock - Solo ADMIN
router.use('/stock', (0, rbac_1.requireRole)(['ADMIN']), stock_routes_1.default);
router.use('/inventory', (0, rbac_1.requireRole)(['ADMIN']), inventory_routes_1.default);
// RRHH - Solo ADMIN
router.use('/hr', (0, rbac_1.requireRole)(['ADMIN']), hr_routes_1.default);
// Reportes
router.use('/reports', (0, rbac_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), report_routes_1.default);
// Configuración
router.use('/loyalty', (0, rbac_1.requireRole)(['ADMIN']), loyalty_routes_1.default);
router.use('/loyalty-rewards', (0, rbac_1.requireRole)(['ADMIN']), loyaltyReward_routes_1.default);
router.use('/loyalty-checkout', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), loyaltyCheckout_routes_1.default);
router.use('/loyalty-config', (0, rbac_1.requireRole)(['ADMIN']), loyaltyConfig_routes_1.default);
router.use('/settings', (0, rbac_1.requireRole)(['ADMIN']), settings_routes_1.default);
// Campañas
router.use('/campaigns', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), campaign_routes_1.default);
// IA
router.use('/ai/products', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), productIntelligence_routes_1.default);
router.use('/ai/clients', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), clientIntelligence_routes_1.default);
router.use('/ai/loyalty', (0, rbac_1.requireRole)(['ADMIN', 'EMPLOYEE']), loyalty_routes_1.default);
// Usuarios
router.use('/users', (0, rbac_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), user_routes_1.default);
console.log('✅ Todas las rutas cargadas correctamente con RBAC');
exports.default = router;

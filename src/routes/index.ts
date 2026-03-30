// src/routes/index.ts
import { Router } from 'express';
import { requireRole, addPharmacyFilter } from '../middleware/rbac';

// Importaciones de controladores
import { pharmacyController } from '../controllers/pharmacy.controller';
import { reportController } from '../controllers/report.controller';
import { userController } from '../controllers/user.controller';
import { dashboardController } from '../controllers/dashboard.controller';
import { supplierController } from '../controllers/supplier.controller';

// Importaciones de rutas existentes
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import supplierRoutes from './supplier.routes';
import reportRoutes from './report.routes';
import saleRoutes from './sale.routes';
import dashboardRoutes from './dashboard.routes';
import clientRoutes from './client.routes';
import hrRoutes from './hr.routes';
import stockRoutes from './stock.routes';
import inventoryRoutes from './inventory.routes';
import settingsRoutes from './settings.routes';

// Importaciones de rutas de IA y lealtad
import productIntelligenceRoutes from './ai/productIntelligence.routes';
import clientIntelligenceRoutes from './ai/clientIntelligence.routes';
import loyaltyRoutes from './ai/loyalty.routes';
import loyaltyRewardRoutes from './loyaltyReward.routes';
import loyaltyCheckoutRoutes from './loyaltyCheckout.routes';
import loyaltyConfigRoutes from './loyaltyConfig.routes';
import campaignRoutes from './campaign.routes';

const router = Router();

console.log('🔄 Cargando rutas con sistema RBAC multi-tenant...');

// ==========================================
// RUTAS PÚBLICAS (Sin autenticación)
// ==========================================
router.use('/auth', authRoutes);
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==========================================
// RUTAS SUPER_ADMIN (Solo usuarios con rol SUPER_ADMIN)
// ==========================================
console.log('  📌 Cargando rutas SUPER_ADMIN...');

router.get('/admin/pharmacies', requireRole(['SUPER_ADMIN']), pharmacyController.getAll);
router.post('/admin/pharmacies', requireRole(['SUPER_ADMIN']), pharmacyController.create);
router.put('/admin/pharmacies/:id', requireRole(['SUPER_ADMIN']), pharmacyController.update);
router.delete('/admin/pharmacies/:id', requireRole(['SUPER_ADMIN']), pharmacyController.delete);
//router.get('/admin/reports/global', requireRole(['SUPER_ADMIN']), reportController.getGlobalStats);
router.get('/admin/users', requireRole(['SUPER_ADMIN']), userController.getAllUsers);
router.get('/admin/users/:id', requireRole(['SUPER_ADMIN']), userController.getUserById);
router.post('/admin/users', requireRole(['SUPER_ADMIN']), userController.createUser);
router.put('/admin/users/:id', requireRole(['SUPER_ADMIN']), userController.updateUser);
router.delete('/admin/users/:id', requireRole(['SUPER_ADMIN']), userController.deleteUser);

// ==========================================
// RUTAS DASHBOARD
// ==========================================
// SUPER_ADMIN ve dashboard global, ADMIN y EMPLOYEE ven dashboard de su farmacia
console.log('  📌 Cargando rutas DASHBOARD...');
router.get('/dashboard', requireRole(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']), dashboardController.getDashboard);
//router.get('/dashboard/stats', requireRole(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']), dashboardController.getStats);
//router.get('/dashboard/charts', requireRole(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']), dashboardController.getCharts);

// ==========================================
// RUTAS VENTAS - ADMIN y EMPLOYEE
// ==========================================
console.log('  📌 Cargando rutas VENTAS...');
router.use('/sales', requireRole(['ADMIN', 'EMPLOYEE']), saleRoutes);

// ==========================================
// RUTAS CLIENTES - ADMIN y EMPLOYEE
// ==========================================
console.log('  📌 Cargando rutas CLIENTES...');
router.use('/clients', requireRole(['ADMIN', 'EMPLOYEE']), clientRoutes);

// ==========================================
// RUTAS PRODUCTOS - ADMIN y EMPLOYEE (consulta y venta)
// ==========================================
console.log('  📌 Cargando rutas PRODUCTOS...');
router.use('/products', requireRole(['ADMIN', 'EMPLOYEE']), productRoutes);

// ==========================================
// RUTAS STOCK - SOLO ADMIN (ajustes de inventario)
// ==========================================
console.log('  📌 Cargando rutas STOCK (solo ADMIN)...');
router.use('/stock', requireRole(['ADMIN']), stockRoutes);
router.use('/inventory', requireRole(['ADMIN']), inventoryRoutes);

// ==========================================
// RUTAS PROVEEDORES - ADMIN y EMPLOYEE (recibir mercancía)
// ==========================================
console.log('  📌 Cargando rutas PROVEEDORES...');
router.get('/suppliers', requireRole(['ADMIN', 'EMPLOYEE']), supplierController.getAll);
router.get('/suppliers/:id', requireRole(['ADMIN', 'EMPLOYEE']), supplierController.getById);
router.post('/suppliers', requireRole(['ADMIN']), supplierController.create);
router.put('/suppliers/:id', requireRole(['ADMIN']), supplierController.update);
router.delete('/suppliers/:id', requireRole(['ADMIN']), supplierController.delete);
//router.post('/suppliers/:id/receive', requireRole(['ADMIN', 'EMPLOYEE']), supplierController.receiveMerchandise);
//router.get('/suppliers/:id/purchases', requireRole(['ADMIN', 'EMPLOYEE']), supplierController.getPurchases);
//router.get('/suppliers/:id/credit-notes', requireRole(['ADMIN', 'EMPLOYEE']), supplierController.getCreditNotes);

// ==========================================
// RUTAS RRHH - SOLO ADMIN
// ==========================================
console.log('  📌 Cargando rutas RRHH (solo ADMIN)...');
router.use('/hr', requireRole(['ADMIN']), hrRoutes);

// ==========================================
// RUTAS REPORTES - ADMIN y SUPER_ADMIN
// ==========================================
console.log('  📌 Cargando rutas REPORTES...');
router.use('/reports', requireRole(['ADMIN', 'SUPER_ADMIN']), reportRoutes);

// ==========================================
// RUTAS CONFIGURACIÓN - SOLO ADMIN
// ==========================================
console.log('  📌 Cargando rutas CONFIGURACIÓN (solo ADMIN)...');
router.use('/loyalty', requireRole(['ADMIN']), loyaltyRoutes);
router.use('/loyalty-rewards', requireRole(['ADMIN']), loyaltyRewardRoutes);
router.use('/loyalty-checkout', requireRole(['ADMIN', 'EMPLOYEE']), loyaltyCheckoutRoutes);
router.use('/loyalty-config', requireRole(['ADMIN']), loyaltyConfigRoutes);
router.use('/settings', requireRole(['ADMIN']), settingsRoutes);

// ==========================================
// RUTAS DE CAMPAÑAS - ADMIN y EMPLOYEE (EMPLOYEE solo consulta)
// ==========================================
console.log('  📌 Cargando rutas CAMPAÑAS...');
router.use('/campaigns', requireRole(['ADMIN', 'EMPLOYEE']), campaignRoutes);

// ==========================================
// RUTAS DE IA - ADMIN y EMPLOYEE
// ==========================================
console.log('  📌 Cargando rutas IA...');
router.use('/ai/products', requireRole(['ADMIN', 'EMPLOYEE']), productIntelligenceRoutes);
router.use('/ai/clients', requireRole(['ADMIN', 'EMPLOYEE']), clientIntelligenceRoutes);
router.use('/ai/loyalty', requireRole(['ADMIN', 'EMPLOYEE']), loyaltyRoutes);

// ==========================================
// RUTAS DE USUARIOS - ADMIN y SUPER_ADMIN
// ==========================================
console.log('  📌 Cargando rutas USUARIOS...');
router.use('/users', requireRole(['ADMIN', 'SUPER_ADMIN']), userRoutes);

console.log('✅ Todas las rutas cargadas correctamente con RBAC');

export default router;
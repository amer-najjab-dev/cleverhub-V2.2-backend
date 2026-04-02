// src/routes/index.ts
import { Router } from 'express';
import { requireRole } from '../middleware/rbac';
import { superAdminController } from '../controllers/superadmin.controller';
import { checkExpirations } from '../controllers/superadmin.controller';

// Importaciones de controladores
import { pharmacyController } from '../controllers/pharmacy.controller';
import { userController } from '../controllers/user.controller';
import { dashboardController } from '../controllers/dashboard.controller';
import { supplierController } from '../controllers/supplier.controller';
import { saleController } from '../controllers/sale.controller';
import { clientController } from '../controllers/client.controller';
import { productController } from '../controllers/product.controller';
import { stockController } from '../controllers/stock.controller';
import { inventoryController } from '../controllers/inventory.controller';
import { settingsController } from '../controllers/settings.controller';

// Importaciones de rutas existentes
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import supplierRoutes from './supplier.routes';
import reportRoutes from './report.routes';
import saleRoutes from './sale.routes';
import clientRoutes from './client.routes';
import hrRoutes from './hr.routes';

// Importaciones de rutas de IA y lealtad
import productIntelligenceRoutes from './ai/productIntelligence.routes';
import clientIntelligenceRoutes from './ai/clientIntelligence.routes';
import loyaltyRoutes from './ai/loyalty.routes';
import loyaltyRewardRoutes from './loyaltyReward.routes';
import loyaltyCheckoutRoutes from './loyaltyCheckout.routes';
import loyaltyConfigRoutes from './loyaltyConfig.routes';
import campaignRoutes from './campaign.routes';

// Importaciones de rutas adicionales
import stockRoutes from './stock.routes';
import inventoryRoutes from './inventory.routes';
import settingsRoutes from './settings.routes';
import superAdminRoutes from './superadmin.routes';

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
    
    const result = await checkExpirations();
    res.json({ 
      success: true, 
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in cron job:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// RUTAS CON PREFIJO /api (para compatibilidad con frontend)
// ==========================================

// Módulos
router.get('/api/modules', requireRole(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']), async (req: any, res) => {
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
    
    const availableModules = modules[userRole as keyof typeof modules] || [];
    res.json({ success: true, data: availableModules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dashboard endpoints
router.get('/api/dashboard/kpis', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getKPIs);
router.get('/api/dashboard/hourly-sales', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getHourlySales);
router.get('/api/dashboard/comparative', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getComparativeData);
router.get('/api/dashboard/top-products', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getTopProducts);

// ==========================================
// RUTAS SUPER_ADMIN CON PREFIJO /api
// ==========================================

// Farmacias
router.get('/api/admin/pharmacies', requireRole(['SUPER_ADMIN']), pharmacyController.getAll);
router.post('/api/admin/pharmacies', requireRole(['SUPER_ADMIN']), pharmacyController.create);
router.put('/api/admin/pharmacies/:id', requireRole(['SUPER_ADMIN']), pharmacyController.update);
router.delete('/api/admin/pharmacies/:id', requireRole(['SUPER_ADMIN']), pharmacyController.delete);

// Usuarios globales
router.get('/api/admin/users', requireRole(['SUPER_ADMIN']), userController.getAllUsers);
router.get('/api/admin/users/:id', requireRole(['SUPER_ADMIN']), userController.getUserById);
router.post('/api/admin/users', requireRole(['SUPER_ADMIN']), userController.createUser);
router.put('/api/admin/users/:id', requireRole(['SUPER_ADMIN']), userController.updateUser);
router.delete('/api/admin/users/:id', requireRole(['SUPER_ADMIN']), userController.deleteUser);

// Suscripciones
router.get('/api/admin/subscriptions', requireRole(['SUPER_ADMIN']), superAdminController.getSubscriptions);
router.post('/api/admin/subscriptions', requireRole(['SUPER_ADMIN']), superAdminController.createSubscription);
router.post('/api/admin/subscriptions/extend-courtesy', requireRole(['SUPER_ADMIN']), superAdminController.extendCourtesy);
router.post('/api/admin/subscriptions/renew', requireRole(['SUPER_ADMIN']), superAdminController.renewLicense);

// Health status
router.get('/api/admin/health-status', requireRole(['SUPER_ADMIN']), superAdminController.getHealthStatus);

// Broadcast
router.post('/api/admin/broadcast', requireRole(['SUPER_ADMIN']), superAdminController.sendBroadcast);

// Stats (si se usa)
router.get('/api/admin/stats', requireRole(['SUPER_ADMIN']), dashboardController.getStockStats);

// Logs de auditoría
router.get('/api/admin/logs', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { prisma } = await import('../server');
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// RUTAS API CON PREFIJO /api - USAR RUTAS EXISTENTES
// ==========================================

// Ventas
router.use('/api/sales', requireRole(['ADMIN', 'EMPLOYEE']), saleRoutes);

// Clientes
router.use('/api/clients', requireRole(['ADMIN', 'EMPLOYEE']), clientRoutes);

// Productos
router.use('/api/products', requireRole(['ADMIN', 'EMPLOYEE']), productRoutes);

// Stock - Solo ADMIN
router.use('/api/stock', requireRole(['ADMIN']), stockRoutes);

// Inventario - Solo ADMIN
router.use('/api/inventory', requireRole(['ADMIN']), inventoryRoutes);

// Proveedores - Solo ADMIN
router.use('/api/suppliers', requireRole(['ADMIN']), supplierRoutes);

// RRHH - Solo ADMIN
router.use('/api/hr', requireRole(['ADMIN']), hrRoutes);

// Reportes - ADMIN y SUPER_ADMIN
router.use('/api/reports', requireRole(['ADMIN', 'SUPER_ADMIN']), reportRoutes);

// Configuración - Solo ADMIN
router.use('/api/loyalty', requireRole(['ADMIN']), loyaltyRoutes);
router.use('/api/loyalty-rewards', requireRole(['ADMIN']), loyaltyRewardRoutes);
router.use('/api/loyalty-checkout', requireRole(['ADMIN', 'EMPLOYEE']), loyaltyCheckoutRoutes);
router.use('/api/loyalty-config', requireRole(['ADMIN']), loyaltyConfigRoutes);
router.use('/api/settings', requireRole(['ADMIN']), settingsRoutes);

// Campañas - ADMIN y EMPLOYEE
router.use('/api/campaigns', requireRole(['ADMIN', 'EMPLOYEE']), campaignRoutes);

// IA - ADMIN y EMPLOYEE
router.use('/api/ai/products', requireRole(['ADMIN', 'EMPLOYEE']), productIntelligenceRoutes);
router.use('/api/ai/clients', requireRole(['ADMIN', 'EMPLOYEE']), clientIntelligenceRoutes);
router.use('/api/ai/loyalty', requireRole(['ADMIN', 'EMPLOYEE']), loyaltyRoutes);

// Usuarios - ADMIN y SUPER_ADMIN
router.use('/api/users', requireRole(['ADMIN', 'SUPER_ADMIN']), userRoutes);

// ==========================================
// RUTA PARA OBTENER MÓDULOS POR ROL (sin prefijo)
// ==========================================
router.get('/modules', requireRole(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']), async (req: any, res) => {
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
    
    const availableModules = modules[userRole as keyof typeof modules] || [];
    res.json({ success: true, data: availableModules });
  } catch (error: any) {
    console.error('Error getting modules:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// RUTAS SUPER_ADMIN (Protegidas) - sin prefijo
// ==========================================
console.log('  📌 Cargando rutas SUPER_ADMIN...');

// Rutas de gestión de farmacias
router.get('/admin/pharmacies', requireRole(['SUPER_ADMIN']), pharmacyController.getAll);
router.post('/admin/pharmacies', requireRole(['SUPER_ADMIN']), pharmacyController.create);
router.put('/admin/pharmacies/:id', requireRole(['SUPER_ADMIN']), pharmacyController.update);
router.delete('/admin/pharmacies/:id', requireRole(['SUPER_ADMIN']), pharmacyController.delete);

// Rutas de gestión de usuarios globales
router.get('/admin/users', requireRole(['SUPER_ADMIN']), userController.getAllUsers);
router.get('/admin/users/:id', requireRole(['SUPER_ADMIN']), userController.getUserById);
router.post('/admin/users', requireRole(['SUPER_ADMIN']), userController.createUser);
router.put('/admin/users/:id', requireRole(['SUPER_ADMIN']), userController.updateUser);
router.delete('/admin/users/:id', requireRole(['SUPER_ADMIN']), userController.deleteUser);

// Estadísticas globales
router.get('/admin/stats', requireRole(['SUPER_ADMIN']), dashboardController.getStockStats);

// Rutas de semáforo de salud
router.get('/admin/health-status', requireRole(['SUPER_ADMIN']), superAdminController.getHealthStatus);

// Rutas de logs de auditoría
router.get('/admin/logs', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { prisma } = await import('../server');
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Todas las rutas de superadmin (suscripciones, broadcast, impersonate)
router.use('/admin', requireRole(['SUPER_ADMIN']), superAdminRoutes);

// ==========================================
// RUTAS DASHBOARD - ADMIN y EMPLOYEE (sin prefijo)
// ==========================================
console.log('  📌 Cargando rutas DASHBOARD...');
router.get('/dashboard', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getDashboard);
router.get('/dashboard/kpis', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getKPIs);
router.get('/dashboard/hourly-sales', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getHourlySales);
router.get('/dashboard/comparative', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getComparativeData);
router.get('/dashboard/top-products', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getTopProducts);
router.get('/dashboard/average-ticket', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getAverageTicket);
router.get('/dashboard/low-stock', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getLowStockCount);
router.get('/dashboard/quick-summary', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getQuickSummary);
router.get('/dashboard/stock-stats', requireRole(['ADMIN', 'EMPLOYEE']), dashboardController.getStockStats);

// ==========================================
// RUTAS SIN PREFIJO API (Compatibilidad) - SOLO ADMIN
// ==========================================
console.log('  📌 Cargando rutas sin prefijo (compatibilidad)...');

// Ventas
router.use('/sales', requireRole(['ADMIN', 'EMPLOYEE']), saleRoutes);

// Clientes
router.use('/clients', requireRole(['ADMIN', 'EMPLOYEE']), clientRoutes);

// Productos
router.use('/products', requireRole(['ADMIN', 'EMPLOYEE']), productRoutes);

// Proveedores - SOLO ADMIN
router.get('/suppliers', requireRole(['ADMIN']), supplierController.getAll);
router.get('/suppliers/:id', requireRole(['ADMIN']), supplierController.getById);
router.post('/suppliers', requireRole(['ADMIN']), supplierController.create);
router.put('/suppliers/:id', requireRole(['ADMIN']), supplierController.update);
router.delete('/suppliers/:id', requireRole(['ADMIN']), supplierController.delete);

// Stock - Solo ADMIN
router.use('/stock', requireRole(['ADMIN']), stockRoutes);
router.use('/inventory', requireRole(['ADMIN']), inventoryRoutes);

// RRHH - Solo ADMIN
router.use('/hr', requireRole(['ADMIN']), hrRoutes);

// Reportes - ADMIN y SUPER_ADMIN
router.use('/reports', requireRole(['ADMIN', 'SUPER_ADMIN']), reportRoutes);

// Configuración - Solo SUPER_ADMIN
router.use('/settings', requireRole(['SUPER_ADMIN']), settingsRoutes);

// Lealtad - ADMIN (configuración interna de la farmacia)
router.use('/loyalty', requireRole(['ADMIN']), loyaltyRoutes);
router.use('/loyalty-rewards', requireRole(['ADMIN']), loyaltyRewardRoutes);
router.use('/loyalty-checkout', requireRole(['ADMIN', 'EMPLOYEE']), loyaltyCheckoutRoutes);
router.use('/loyalty-config', requireRole(['ADMIN']), loyaltyConfigRoutes);

// Campañas - ADMIN y EMPLOYEE
router.use('/campaigns', requireRole(['ADMIN', 'EMPLOYEE']), campaignRoutes);

// IA - ADMIN y EMPLOYEE
router.use('/ai/products', requireRole(['ADMIN', 'EMPLOYEE']), productIntelligenceRoutes);
router.use('/ai/clients', requireRole(['ADMIN', 'EMPLOYEE']), clientIntelligenceRoutes);
router.use('/ai/loyalty', requireRole(['ADMIN', 'EMPLOYEE']), loyaltyRoutes);

// Usuarios - ADMIN y SUPER_ADMIN
router.use('/users', requireRole(['ADMIN', 'SUPER_ADMIN']), userRoutes);

console.log('✅ Todas las rutas cargadas correctamente con RBAC');

export default router;
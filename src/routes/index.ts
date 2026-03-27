// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import supplierRoutes from './supplier.routes';
import reportRoutes from './report.routes';
import saleRoutes from './sale.routes';
import dashboardRoutes from './dashboard.routes';

// NUEVAS IMPORTACIONES
import productIntelligenceRoutes from './ai/productIntelligence.routes';
import clientIntelligenceRoutes from './ai/clientIntelligence.routes';
import loyaltyRoutes from './ai/loyalty.routes';
import loyaltyRewardRoutes from './loyaltyReward.routes';
import loyaltyCheckoutRoutes from './loyaltyCheckout.routes';
import loyaltyConfigRoutes from './loyaltyConfig.routes';
import campaignRoutes from './campaign.routes';
import clientRoutes from './client.routes';
import hrRoutes from './hr.routes';


const router = Router();

console.log('🔄 Cargando rutas principales...');

// Rutas existentes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/reports', reportRoutes);
router.use('/sales', saleRoutes);
router.use('/dashboard', dashboardRoutes);

// NUEVAS RUTAS
router.use('/ai/products', productIntelligenceRoutes);
router.use('/ai/clients', clientIntelligenceRoutes);
router.use('/ai/loyalty', loyaltyRoutes);
router.use('/loyalty', loyaltyRewardRoutes);
router.use('/loyalty-checkout', loyaltyCheckoutRoutes);
router.use('/loyalty-config', loyaltyConfigRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/clients', clientRoutes);
router.use('/hr', hrRoutes);

// Ruta de salud
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

console.log('✅ Todas las rutas cargadas correctamente');

export default router;

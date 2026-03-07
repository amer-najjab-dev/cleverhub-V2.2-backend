// backend/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import clientRoutes from './client.routes';
import paymentRoutes from './payment.routes';
import productRoutes from './product.routes';
import saleRoutes from './sale.routes';
import dashboardRoutes from './dashboard.routes';
import inventoryRoutes from './inventory.routes';
import supplierRoutes from './supplier.routes';
import reportRoutes from './report.routes';
import productIntelligenceRoutes from './ai/productIntelligence.routes';
import clientIntelligenceRoutes from './ai/clientIntelligence.routes';
import loyaltyRoutes from './ai/loyalty.routes';
import loyaltyRewardRoutes from './loyaltyReward.routes';
import loyaltyCheckoutRoutes from './loyaltyCheckout.routes';
import loyaltyConfigRoutes from './loyaltyConfig.routes';
import campaignRoutes from './campaign.routes'; // <-- AÑADIR

const router = Router();

console.log('🔄 Cargando rutas...');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/payments', paymentRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/reports', reportRoutes);
router.use('/ai/products', productIntelligenceRoutes);
router.use('/ai/clients', clientIntelligenceRoutes);
router.use('/ai/loyalty', loyaltyRoutes);
router.use('/loyalty', loyaltyRewardRoutes);
router.use('/loyalty-checkout', loyaltyCheckoutRoutes);
router.use('/loyalty-config', loyaltyConfigRoutes);
router.use('/campaigns', campaignRoutes); // <-- AÑADIR

console.log('✅ Todas las rutas cargadas');

export default router;
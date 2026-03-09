"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/index.ts
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const client_routes_1 = __importDefault(require("./client.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const product_routes_1 = __importDefault(require("./product.routes"));
const sale_routes_1 = __importDefault(require("./sale.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const inventory_routes_1 = __importDefault(require("./inventory.routes"));
const supplier_routes_1 = __importDefault(require("./supplier.routes"));
const report_routes_1 = __importDefault(require("./report.routes"));
const productIntelligence_routes_1 = __importDefault(require("./ai/productIntelligence.routes"));
const clientIntelligence_routes_1 = __importDefault(require("./ai/clientIntelligence.routes"));
const loyalty_routes_1 = __importDefault(require("./ai/loyalty.routes"));
const loyaltyReward_routes_1 = __importDefault(require("./loyaltyReward.routes"));
const loyaltyCheckout_routes_1 = __importDefault(require("./loyaltyCheckout.routes"));
const loyaltyConfig_routes_1 = __importDefault(require("./loyaltyConfig.routes"));
const campaign_routes_1 = __importDefault(require("./campaign.routes")); // <-- AÑADIR
const router = (0, express_1.Router)();
console.log('🔄 Cargando rutas...');
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/clients', client_routes_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/products', product_routes_1.default);
router.use('/sales', sale_routes_1.default);
router.use('/dashboard', dashboard_routes_1.default);
router.use('/inventory', inventory_routes_1.default);
router.use('/suppliers', supplier_routes_1.default);
router.use('/reports', report_routes_1.default);
router.use('/ai/products', productIntelligence_routes_1.default);
router.use('/ai/clients', clientIntelligence_routes_1.default);
router.use('/ai/loyalty', loyalty_routes_1.default);
router.use('/loyalty', loyaltyReward_routes_1.default);
router.use('/loyalty-checkout', loyaltyCheckout_routes_1.default);
router.use('/loyalty-config', loyaltyConfig_routes_1.default);
router.use('/campaigns', campaign_routes_1.default); // <-- AÑADIR
console.log('✅ Todas las rutas cargadas');
exports.default = router;

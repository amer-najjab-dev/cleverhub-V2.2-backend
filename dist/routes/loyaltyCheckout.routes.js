"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loyaltyCheckout_controller_1 = require("../controllers/loyaltyCheckout.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Obtener recompensas disponibles para un cliente
router.get('/available/:clientId', loyaltyCheckout_controller_1.loyaltyCheckoutController.getAvailableRewards.bind(loyaltyCheckout_controller_1.loyaltyCheckoutController));
// Canjear múltiples items
router.post('/redeem/:clientId', loyaltyCheckout_controller_1.loyaltyCheckoutController.redeemItems.bind(loyaltyCheckout_controller_1.loyaltyCheckoutController));
exports.default = router;

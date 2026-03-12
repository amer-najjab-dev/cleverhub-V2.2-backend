"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loyaltyCheckout_controller_1 = require("../controllers/loyaltyCheckout.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Rutas para checkout de loyalty
router.get('/client/:clientId/rewards', (req, res) => loyaltyCheckout_controller_1.loyaltyCheckoutController.getAvailableRewards(req, res));
router.get('/client/:clientId/packs', (req, res) => loyaltyCheckout_controller_1.loyaltyCheckoutController.getAvailablePacks(req, res));
router.get('/client/:clientId/rewards/:rewardId/validate', (req, res) => loyaltyCheckout_controller_1.loyaltyCheckoutController.validateRewardRedemption(req, res));
router.get('/client/:clientId/packs/:packId/validate', (req, res) => loyaltyCheckout_controller_1.loyaltyCheckoutController.validatePackRedemption(req, res));
router.get('/client/:clientId/redemptions', (req, res) => loyaltyCheckout_controller_1.loyaltyCheckoutController.getClientRedemptions(req, res));
exports.default = router;

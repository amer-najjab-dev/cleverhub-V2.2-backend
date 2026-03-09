"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loyaltyReward_controller_1 = require("../controllers/loyaltyReward.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Catálogo de recompensas
router.get('/rewards', loyaltyReward_controller_1.loyaltyRewardController.getAllRewards.bind(loyaltyReward_controller_1.loyaltyRewardController));
router.post('/rewards', loyaltyReward_controller_1.loyaltyRewardController.createReward.bind(loyaltyReward_controller_1.loyaltyRewardController));
router.put('/rewards/:id', loyaltyReward_controller_1.loyaltyRewardController.updateReward.bind(loyaltyReward_controller_1.loyaltyRewardController));
router.delete('/rewards/:id', loyaltyReward_controller_1.loyaltyRewardController.deleteReward.bind(loyaltyReward_controller_1.loyaltyRewardController));
// Packs
router.get('/packs', loyaltyReward_controller_1.loyaltyRewardController.getAllPacks.bind(loyaltyReward_controller_1.loyaltyRewardController));
router.post('/packs', loyaltyReward_controller_1.loyaltyRewardController.createPack.bind(loyaltyReward_controller_1.loyaltyRewardController));
// Canjes
router.post('/redeem/reward/:clientId/:rewardId', loyaltyReward_controller_1.loyaltyRewardController.redeemReward.bind(loyaltyReward_controller_1.loyaltyRewardController));
router.post('/redeem/pack/:clientId/:packId', loyaltyReward_controller_1.loyaltyRewardController.redeemPack.bind(loyaltyReward_controller_1.loyaltyRewardController));
// Reportes
router.get('/closure', loyaltyReward_controller_1.loyaltyRewardController.getLoyaltyClosure.bind(loyaltyReward_controller_1.loyaltyRewardController));
// IA Strategist
router.get('/suggestions', loyaltyReward_controller_1.loyaltyRewardController.getPromotionSuggestions.bind(loyaltyReward_controller_1.loyaltyRewardController));
router.get('/weekly-strategy', loyaltyReward_controller_1.loyaltyRewardController.getWeeklyStrategy.bind(loyaltyReward_controller_1.loyaltyRewardController));
exports.default = router;

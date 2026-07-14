"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyCheckoutController = exports.LoyaltyCheckoutController = void 0;
const server_1 = require("../server");
class LoyaltyCheckoutController {
    // Obtener recompensas disponibles para un cliente
    async getAvailableRewards(req, res) {
        try {
            const { clientId } = req.params;
            const client = await server_1.prisma.clients.findUnique({
                where: { id: parseInt(clientId) },
            });
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client non trouvé',
                });
            }
            const rewards = await server_1.prisma.loyalty_rewards.findMany({
                where: {
                    is_active: true,
                    AND: [
                        {
                            OR: [
                                { start_date: null },
                                { start_date: { lte: new Date() } },
                            ],
                        },
                        {
                            OR: [
                                { end_date: null },
                                { end_date: { gte: new Date() } },
                            ],
                        },
                    ],
                },
                include: {
                    products: true,
                },
                orderBy: {
                    points_cost: 'asc',
                },
            });
            const availableRewards = rewards
                .filter((r) => (client.loyalty_points || 0) >= r.points_cost)
                .map((r) => ({
                id: r.id,
                productId: r.product_id,
                productName: r.product?.name,
                productImage: r.product?.imageUrl,
                pointsCost: r.points_cost,
                description: r.description,
                stock: r.product?.stock || 0,
            }));
            const unavailableRewards = rewards
                .filter((r) => (client.loyalty_points || 0) < r.points_cost)
                .map((r) => ({
                id: r.id,
                productId: r.product_id,
                productName: r.product?.name,
                pointsCost: r.points_cost,
                pointsNeeded: r.points_cost - (client.loyalty_points || 0),
            }));
            res.json({
                success: true,
                data: {
                    clientPoints: client.loyalty_points || 0,
                    available: availableRewards,
                    upcoming: unavailableRewards.slice(0, 5),
                },
            });
        }
        catch (error) {
            console.error('Error getting available rewards:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    // Obtener packs disponibles para un cliente
    async getAvailablePacks(req, res) {
        try {
            const { clientId } = req.params;
            const client = await server_1.prisma.clients.findUnique({
                where: { id: parseInt(clientId) },
            });
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client non trouvé',
                });
            }
            const packs = await server_1.prisma.loyalty_packs.findMany({
                where: {
                    is_active: true,
                    AND: [
                        {
                            OR: [
                                { start_date: null },
                                { start_date: { lte: new Date() } },
                            ],
                        },
                        {
                            OR: [
                                { end_date: null },
                                { end_date: { gte: new Date() } },
                            ],
                        },
                    ],
                },
                include: {
                    loyalty_pack_products: {
                        include: {
                            products: true, // 'products' es el nombre de la relación en loyalty_pack_products
                        },
                    },
                },
                orderBy: {
                    points_cost: 'asc',
                },
            });
            const availablePacks = packs
                .filter((p) => (client.loyalty_points || 0) >= p.points_cost)
                .map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                pointsCost: p.points_cost,
                imageUrl: p.image_url,
                products: p.products.map((pp) => ({
                    id: pp.product.id,
                    name: pp.product.name,
                    imageUrl: pp.product.imageUrl,
                })),
            }));
            res.json({
                success: true,
                data: {
                    clientPoints: client.loyalty_points || 0,
                    available: availablePacks,
                },
            });
        }
        catch (error) {
            console.error('Error getting available packs:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    // Validar si un cliente puede canjear una recompensa
    async validateRewardRedemption(req, res) {
        try {
            const { clientId, rewardId } = req.params;
            const [client, reward] = await Promise.all([
                server_1.prisma.clients.findUnique({
                    where: { id: parseInt(clientId) },
                }),
                server_1.prisma.loyalty_rewards.findUnique({
                    where: { id: parseInt(rewardId) },
                    include: { products: true },
                }),
            ]);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client non trouvé',
                });
            }
            if (!reward) {
                return res.status(404).json({
                    success: false,
                    message: 'Récompense non trouvée',
                });
            }
            const hasEnoughPoints = (client.loyalty_points || 0) >= reward.points_cost;
            const hasStock = (reward.products?.stock || 0) > 0;
            const isActive = reward.is_active;
            const errors = [];
            if (!hasEnoughPoints)
                errors.push('Points insuffisants');
            if (!hasStock)
                errors.push('Produit en rupture de stock');
            if (!isActive)
                errors.push('Récompense non active');
            res.json({
                success: true,
                data: {
                    isValid: hasEnoughPoints && hasStock && isActive,
                    clientPoints: client.loyalty_points || 0,
                    rewardPoints: reward.points_cost,
                    hasEnoughPoints,
                    hasStock,
                    isActive,
                    errors,
                },
            });
        }
        catch (error) {
            console.error('Error validating redemption:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    // Validar si un cliente puede canjear un pack
    async validatePackRedemption(req, res) {
        try {
            const { clientId, packId } = req.params;
            const [client, pack] = await Promise.all([
                server_1.prisma.clients.findUnique({
                    where: { id: parseInt(clientId) },
                }),
                server_1.prisma.loyalty_packs.findUnique({
                    where: { id: parseInt(packId) },
                    include: {
                        loyalty_pack_products: {
                            include: { products: true },
                        },
                    },
                }),
            ]);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client non trouvé',
                });
            }
            if (!pack) {
                return res.status(404).json({
                    success: false,
                    message: 'Pack non trouvé',
                });
            }
            const hasEnoughPoints = (client.loyalty_points || 0) >= pack.points_cost;
            const hasStock = pack.loyalty_pack_products.every((lp) => lp.products.stock > 0);
            const isActive = pack.is_active;
            const errors = [];
            if (!hasEnoughPoints)
                errors.push('Points insuffisants');
            if (!hasStock)
                errors.push('Certains produits sont en rupture de stock');
            if (!isActive)
                errors.push('Pack non actif');
            res.json({
                success: true,
                data: {
                    isValid: hasEnoughPoints && hasStock && isActive,
                    clientPoints: client.loyalty_points || 0,
                    packPoints: pack.points_cost,
                    hasEnoughPoints,
                    hasStock,
                    isActive,
                    errors,
                    products: pack.loyalty_pack_products.map((lp) => ({
                        name: lp.products.name,
                        hasStock: lp.products.stock > 0,
                    })),
                },
            });
        }
        catch (error) {
            console.error('Error validating pack redemption:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    // Obtener historial de canjes del cliente
    async getClientRedemptions(req, res) {
        try {
            const { clientId } = req.params;
            const { limit = 10 } = req.query;
            const transactions = await server_1.prisma.loyalty_transactions.findMany({
                where: {
                    client_id: parseInt(clientId),
                    type: 'redeemed',
                },
                include: {
                    loyalty_rewards: {
                        include: { products: true },
                    },
                    loyalty_packs: true,
                },
                orderBy: {
                    created_at: 'desc',
                },
                take: Number(limit),
            });
            const redemptions = transactions.map((t) => ({
                id: t.id,
                date: t.created_at,
                points: Math.abs(t.points),
                type: t.reward ? 'reward' : 'pack',
                name: t.reward?.product?.name || t.pack?.name,
                reason: t.reason,
                value: t.product_value,
            }));
            res.json({
                success: true,
                data: redemptions,
            });
        }
        catch (error) {
            console.error('Error getting client redemptions:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}
exports.LoyaltyCheckoutController = LoyaltyCheckoutController;
exports.loyaltyCheckoutController = new LoyaltyCheckoutController();

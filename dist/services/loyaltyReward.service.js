"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyRewardService = exports.LoyaltyRewardService = void 0;
const data_source_1 = require("../data-source");
const LoyaltyReward_1 = require("../entities/LoyaltyReward");
const LoyaltyPack_1 = require("../entities/LoyaltyPack");
const LoyaltyTransaction_1 = require("../entities/LoyaltyTransaction");
const Product_1 = require("../entities/Product");
const Client_1 = require("../entities/Client");
const Sale_1 = require("../entities/Sale");
const typeorm_1 = require("typeorm");
class LoyaltyRewardService {
    constructor() {
        this.rewardRepo = data_source_1.AppDataSource.getRepository(LoyaltyReward_1.LoyaltyReward);
        this.packRepo = data_source_1.AppDataSource.getRepository(LoyaltyPack_1.LoyaltyPack);
        this.transactionRepo = data_source_1.AppDataSource.getRepository(LoyaltyTransaction_1.LoyaltyTransaction);
        this.productRepo = data_source_1.AppDataSource.getRepository(Product_1.Product);
        this.clientRepo = data_source_1.AppDataSource.getRepository(Client_1.Client);
        this.saleRepo = data_source_1.AppDataSource.getRepository(Sale_1.Sale);
    }
    // ========== CATÁLOGO DE RECOMPENSAS ==========
    async getAllRewards(activeOnly = true) {
        const where = {};
        if (activeOnly) {
            where.isActive = true;
            const now = new Date();
            where.startDate = (0, typeorm_1.LessThan)(now);
            where.endDate = (0, typeorm_1.MoreThan)(now);
        }
        return this.rewardRepo.find({
            where,
            relations: ['product'],
            order: { pointsCost: 'ASC' }
        });
    }
    async createReward(data) {
        const product = await this.productRepo.findOne({ where: { id: data.productId } });
        if (!product)
            throw new Error('Product not found');
        const reward = this.rewardRepo.create({
            productId: data.productId,
            pointsCost: data.pointsCost,
            isActive: data.isActive ?? true,
            description: data.description,
            maxQuantity: data.maxQuantity,
            startDate: data.startDate,
            endDate: data.endDate
        });
        return this.rewardRepo.save(reward);
    }
    async updateReward(id, data) {
        await this.rewardRepo.update(id, data);
        const reward = await this.rewardRepo.findOne({ where: { id }, relations: ['product'] });
        if (!reward)
            throw new Error('Reward not found');
        return reward;
    }
    async deleteReward(id) {
        await this.rewardRepo.delete(id);
    }
    // ========== PACKS DE RECOMPENSAS ==========
    async getAllPacks(activeOnly = true) {
        const where = {};
        if (activeOnly) {
            where.isActive = true;
            const now = new Date();
            where.startDate = (0, typeorm_1.LessThan)(now);
            where.endDate = (0, typeorm_1.MoreThan)(now);
        }
        return this.packRepo.find({
            where,
            relations: ['products'],
            order: { pointsCost: 'ASC' }
        });
    }
    async createPack(data) {
        const products = await this.productRepo.findByIds(data.productIds);
        const pack = this.packRepo.create({
            name: data.name,
            description: data.description,
            pointsCost: data.pointsCost,
            isActive: data.isActive ?? true,
            imageUrl: data.imageUrl,
            maxQuantity: data.maxQuantity,
            startDate: data.startDate,
            endDate: data.endDate,
            products
        });
        return this.packRepo.save(pack);
    }
    // ========== CANJE DE PUNTOS ==========
    async redeemReward(clientId, rewardId, saleId) {
        const client = await this.clientRepo.findOne({ where: { id: clientId } });
        if (!client)
            throw new Error('Client not found');
        const reward = await this.rewardRepo.findOne({
            where: { id: rewardId, isActive: true },
            relations: ['product']
        });
        if (!reward)
            throw new Error('Reward not available');
        // Verificar puntos suficientes
        if ((client.loyaltyPoints || 0) < reward.pointsCost) {
            throw new Error('Insufficient points');
        }
        // Verificar stock del producto
        if (reward.product.stock < 1) {
            throw new Error('Product out of stock');
        }
        // Crear transacción
        const transaction = this.transactionRepo.create({
            clientId,
            points: -reward.pointsCost,
            type: 'redeemed',
            reason: `Canje de ${reward.product.name}`,
            rewardId: reward.id,
            saleId,
            productValue: reward.product.pricePPV
        });
        // Actualizar puntos del cliente
        client.loyaltyPoints = (client.loyaltyPoints || 0) - reward.pointsCost;
        // Reducir stock
        reward.product.stock -= 1;
        await data_source_1.AppDataSource.transaction(async (manager) => {
            await manager.save(client);
            await manager.save(reward.product);
            await manager.save(transaction);
        });
        return {
            success: true,
            transaction,
            newBalance: client.loyaltyPoints
        };
    }
    async redeemPack(clientId, packId, saleId) {
        const client = await this.clientRepo.findOne({ where: { id: clientId } });
        if (!client)
            throw new Error('Client not found');
        const pack = await this.packRepo.findOne({
            where: { id: packId, isActive: true },
            relations: ['products']
        });
        if (!pack)
            throw new Error('Pack not available');
        // Verificar puntos suficientes
        if ((client.loyaltyPoints || 0) < pack.pointsCost) {
            throw new Error('Insufficient points');
        }
        // Verificar stock de todos los productos
        for (const product of pack.products) {
            if (product.stock < 1) {
                throw new Error(`Product ${product.name} out of stock`);
            }
        }
        // Crear transacción
        const totalValue = pack.products.reduce((sum, p) => sum + Number(p.pricePPV), 0);
        const transaction = this.transactionRepo.create({
            clientId,
            points: -pack.pointsCost,
            type: 'redeemed',
            reason: `Canje de pack: ${pack.name}`,
            packId: pack.id,
            saleId,
            productValue: totalValue
        });
        // Actualizar puntos del cliente
        client.loyaltyPoints = (client.loyaltyPoints || 0) - pack.pointsCost;
        // Reducir stock de todos los productos
        for (const product of pack.products) {
            product.stock -= 1;
        }
        await data_source_1.AppDataSource.transaction(async (manager) => {
            await manager.save(client);
            await manager.save(pack.products);
            await manager.save(transaction);
        });
        return {
            success: true,
            transaction,
            newBalance: client.loyaltyPoints
        };
    }
    // ========== REPORTES DE PUNTOS ==========
    async getLoyaltyClosure(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        // Ventas reales (no puntos)
        const realSales = await this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.createdAt BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
            .andWhere('sale.paymentMethod != :pointsMethod', { pointsMethod: 'points' })
            .getMany();
        const realSalesTotal = realSales.reduce((sum, s) => sum + Number(s.total), 0);
        // Transacciones de puntos
        const transactions = await this.transactionRepo.find({
            where: {
                createdAt: (0, typeorm_1.Between)(startOfDay, endOfDay)
            },
            relations: ['client', 'reward', 'pack', 'sale']
        });
        const pointsIssued = transactions
            .filter(t => t.type === 'earned' || t.type === 'bonus')
            .reduce((sum, t) => sum + t.points, 0);
        const pointsRedeemed = transactions
            .filter(t => t.type === 'redeemed')
            .reduce((sum, t) => sum + Math.abs(t.points), 0);
        const pointsValueMoved = transactions
            .filter(t => t.type === 'redeemed')
            .reduce((sum, t) => sum + Number(t.productValue || 0), 0);
        return {
            realSales: realSalesTotal,
            pointsValueMoved,
            pointsIssued,
            pointsRedeemed,
            transactions
        };
    }
    // ========== IA STRATEGIST ==========
    async getPromotionSuggestions() {
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        // Productos próximos a caducar (90 días)
        const expiringProducts = await this.productRepo
            .createQueryBuilder('product')
            .where('product.expirationDate <= :date', { date: threeMonthsFromNow })
            .andWhere('product.stock > 5')
            .andWhere('product.laboratory IN (:...labs)', { labs: ['Hypermedic', 'Lodimed'] })
            .getMany();
        // Productos de baja rotación (menos de 5 ventas en 30 días)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const lowRotationProducts = await this.productRepo
            .createQueryBuilder('product')
            .leftJoin('product.saleItems', 'items')
            .leftJoin('items.sale', 'sale')
            .where('sale.createdAt >= :date OR sale.createdAt IS NULL', { date: thirtyDaysAgo })
            .groupBy('product.id')
            .having('COALESCE(SUM(items.quantity), 0) < 5')
            .andWhere('product.stock > 10')
            .andWhere('product.laboratory IN (:...labs)', { labs: ['Hypermedic', 'Lodimed'] })
            .getMany();
        const suggestions = [];
        // Sugerencias para productos próximos a caducar
        for (const product of expiringProducts) {
            const daysToExpiry = Math.ceil((product.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            suggestions.push({
                type: 'expiring',
                productId: product.id,
                productName: product.name,
                laboratory: product.laboratory,
                stock: product.stock,
                daysToExpiry,
                suggestedPoints: Math.floor(product.pricePPV / 10), // 1 punto por cada 10 DHS
                targetTier: 'Or',
                message: `🎯 IA Strategist: Tienes ${product.stock} unidades de ${product.name} que caducan en ${daysToExpiry} días. ¿Quieres crear una promoción de canje por ${Math.floor(product.pricePPV / 10)} puntos para clientes nivel "Or"?`
            });
        }
        // Sugerencias para productos de baja rotación
        for (const product of lowRotationProducts) {
            suggestions.push({
                type: 'lowRotation',
                productId: product.id,
                productName: product.name,
                laboratory: product.laboratory,
                stock: product.stock,
                suggestedPoints: Math.floor(product.pricePPV * 0.7 / 10), // 30% de descuento
                targetTier: 'Argent',
                message: `💡 IA Strategist: ${product.name} tiene baja rotación (stock: ${product.stock}). Ofrécelo por ${Math.floor(product.pricePPV * 0.7 / 10)} puntos a clientes nivel "Argent" para liberar espacio.`
            });
        }
        return suggestions;
    }
    // ========== CAMPAÑAS AUTOMÁTICAS ==========
    async getWeeklyStrategy() {
        const clients = await this.clientRepo
            .createQueryBuilder('client')
            .leftJoinAndSelect('client.sales', 'sales')
            .where('client.loyalty_points IS NOT NULL')
            .getMany();
        const nearOrClients = [];
        for (const client of clients) {
            const points = client.loyaltyPoints || 0;
            const tier = this.calculateTier(points);
            if (tier === 'Argent') {
                const pointsToOr = 5000 - points; // Suponiendo que Or = 5000 puntos
                if (pointsToOr <= 100) {
                    nearOrClients.push({
                        clientId: client.id,
                        clientName: `${client.firstName} ${client.lastName}`,
                        phone: client.phone,
                        currentPoints: points,
                        pointsToOr,
                        suggestedBonus: 100
                    });
                }
            }
        }
        return {
            weekOf: new Date().toISOString().split('T')[0],
            nearOrCount: nearOrClients.length,
            nearOrClients,
            strategy: `🎁 Esta semana, ${nearOrClients.length} clientes de nivel 'Argent' están a menos de 100 puntos de ser 'Or'. Envíales un WhatsApp ofreciendo 100 puntos de regalo si compran algo de la marca Hypermedic hoy.`,
            campaigns: nearOrClients.map(c => ({
                clientId: c.clientId,
                message: `Hola ${c.clientName}, ¡estás a solo ${c.pointsToOr} puntos de alcanzar el nivel OR! Esta semana, por cada compra de productos Hypermedic, recibirás 100 puntos de regalo. ¡Aprovecha!`
            }))
        };
    }
    calculateTier(points) {
        if (points >= 5000)
            return 'Or';
        if (points >= 2000)
            return 'Argent';
        return 'Bronze';
    }
}
exports.LoyaltyRewardService = LoyaltyRewardService;
exports.loyaltyRewardService = new LoyaltyRewardService();

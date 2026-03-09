"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyConfigService = exports.LoyaltyConfigService = void 0;
const data_source_1 = require("../data-source");
const LoyaltyConfig_1 = require("../entities/LoyaltyConfig");
const Client_1 = require("../entities/Client");
const LoyaltyTransaction_1 = require("../entities/LoyaltyTransaction");
class LoyaltyConfigService {
    constructor() {
        this.configRepo = data_source_1.AppDataSource.getRepository(LoyaltyConfig_1.LoyaltyConfig);
        this.clientRepo = data_source_1.AppDataSource.getRepository(Client_1.Client);
        this.transactionRepo = data_source_1.AppDataSource.getRepository(LoyaltyTransaction_1.LoyaltyTransaction);
        // Cache para configuración (evita consultas repetidas)
        this.cachedConfig = null;
        this.lastConfigFetch = 0;
        this.CACHE_TTL = 60000; // 1 minuto
    }
    // Obtener configuración activa
    async getActiveConfig() {
        // Usar cache si es reciente
        if (this.cachedConfig && Date.now() - this.lastConfigFetch < this.CACHE_TTL) {
            return this.cachedConfig;
        }
        let config = await this.configRepo.findOne({ where: { isActive: true } });
        if (!config) {
            // Crear configuración por defecto si no existe
            config = this.configRepo.create({
                pointsPerUnit: 1,
                currencyUnit: 10,
                minPurchaseForPoints: 0,
                pointsExpiryDays: 365,
                welcomePoints: 100,
                birthdayMultiplier: 2.0,
                firstPurchaseMultiplier: 1.5,
                isActive: true,
                tierThresholds: {
                    bronze: { min: 0, max: 1999 },
                    argent: { min: 2000, max: 4999 },
                    or: { min: 5000, max: 999999 }
                }
            });
            config = await this.configRepo.save(config);
        }
        // Actualizar cache
        this.cachedConfig = config;
        this.lastConfigFetch = Date.now();
        return config;
    }
    // Versión síncrona para simulación (usa el último valor conocido)
    getCachedConfigSync() {
        if (!this.cachedConfig) {
            // Si no hay cache, usar valores por defecto
            return {
                id: 0,
                pointsPerUnit: 1,
                currencyUnit: 10,
                minPurchaseForPoints: 0,
                pointsExpiryDays: 365,
                welcomePoints: 100,
                birthdayMultiplier: 2.0,
                firstPurchaseMultiplier: 1.5,
                isActive: true,
                tierThresholds: {
                    bronze: { min: 0, max: 1999 },
                    argent: { min: 2000, max: 4999 },
                    or: { min: 5000, max: 999999 }
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }
        return this.cachedConfig;
    }
    // Actualizar configuración
    async updateConfig(data) {
        const config = await this.getActiveConfig();
        Object.assign(config, data);
        const updated = await this.configRepo.save(config);
        // Actualizar cache
        this.cachedConfig = updated;
        this.lastConfigFetch = Date.now();
        return updated;
    }
    // Calcular puntos por compra
    async calculatePoints(saleAmount, clientId, isFirstPurchase = false, isBirthday = false) {
        const config = await this.getActiveConfig();
        if (saleAmount < config.minPurchaseForPoints) {
            return 0;
        }
        let points = Math.floor(saleAmount / config.currencyUnit) * config.pointsPerUnit;
        // Aplicar multiplicadores
        if (isFirstPurchase) {
            points = Math.floor(points * config.firstPurchaseMultiplier);
        }
        if (isBirthday) {
            points = Math.floor(points * config.birthdayMultiplier);
        }
        return points;
    }
    // Asignar puntos de bienvenida a nuevo cliente
    async assignWelcomePoints(clientId) {
        const config = await this.getActiveConfig();
        const transaction = this.transactionRepo.create({
            clientId,
            points: config.welcomePoints,
            type: 'bonus',
            reason: 'Points de bienvenue'
        });
        await this.transactionRepo.save(transaction);
        // Actualizar puntos del cliente
        await this.clientRepo.increment({ id: clientId }, 'loyaltyPoints', config.welcomePoints);
    }
    // Obtener estadísticas de puntos
    async getPointsStatistics() {
        const config = await this.getActiveConfig();
        const totalPointsIssued = await this.transactionRepo
            .createQueryBuilder('t')
            .where('t.type IN (:...types)', { types: ['earned', 'bonus', 'promotion'] })
            .select('SUM(t.points)', 'total')
            .getRawOne();
        const totalPointsRedeemed = await this.transactionRepo
            .createQueryBuilder('t')
            .where('t.type = :type', { type: 'redeemed' })
            .select('SUM(ABS(t.points))', 'total')
            .getRawOne();
        const averagePointsPerClient = await this.clientRepo
            .createQueryBuilder('c')
            .select('AVG(c.loyalty_points)', 'avg')
            .getRawOne();
        return {
            config,
            statistics: {
                totalPointsIssued: parseInt(totalPointsIssued?.total) || 0,
                totalPointsRedeemed: parseInt(totalPointsRedeemed?.total) || 0,
                averagePointsPerClient: Math.round(averagePointsPerClient?.avg) || 0,
                pointsInCirculation: (parseInt(totalPointsIssued?.total) || 0) - (parseInt(totalPointsRedeemed?.total) || 0)
            }
        };
    }
    // Simulador de puntos (VERSIÓN CORREGIDA - usa cache síncrono)
    simulatePoints(amount, isFirstPurchase = false, isBirthday = false) {
        const config = this.getCachedConfigSync();
        const basePoints = Math.floor(amount / config.currencyUnit) * config.pointsPerUnit;
        let finalPoints = basePoints;
        const multipliers = [];
        if (basePoints === 0) {
            return { basePoints: 0, finalPoints: 0, multipliers: [] };
        }
        if (isFirstPurchase && config.firstPurchaseMultiplier > 1) {
            multipliers.push({
                name: 'Premier achat',
                value: config.firstPurchaseMultiplier
            });
            finalPoints = Math.floor(finalPoints * config.firstPurchaseMultiplier);
        }
        if (isBirthday && config.birthdayMultiplier > 1) {
            multipliers.push({
                name: 'Anniversaire',
                value: config.birthdayMultiplier
            });
            finalPoints = Math.floor(finalPoints * config.birthdayMultiplier);
        }
        return { basePoints, finalPoints, multipliers };
    }
    // Invalidar cache (útil después de actualizaciones externas)
    invalidateCache() {
        this.cachedConfig = null;
    }
}
exports.LoyaltyConfigService = LoyaltyConfigService;
exports.loyaltyConfigService = new LoyaltyConfigService();

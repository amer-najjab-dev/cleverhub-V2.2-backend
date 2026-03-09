"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyService = exports.LoyaltyService = void 0;
const data_source_1 = require("../../data-source");
const Client_1 = require("../../entities/Client");
const Sale_1 = require("../../entities/Sale");
const Product_1 = require("../../entities/Product");
class LoyaltyService {
    constructor() {
        this.clientRepo = data_source_1.AppDataSource.getRepository(Client_1.Client);
        this.saleRepo = data_source_1.AppDataSource.getRepository(Sale_1.Sale);
        this.productRepo = data_source_1.AppDataSource.getRepository(Product_1.Product);
        // Configuración por defecto (1 punto por cada 10 DHS)
        this.config = {
            pointsPerUnit: 1,
            currencyUnit: 10
        };
    }
    // Calcular puntos para un cliente
    async calculateClientPoints(clientId) {
        const client = await this.clientRepo.findOne({ where: { id: clientId } });
        if (!client)
            throw new Error('Client not found');
        const sales = await this.saleRepo.find({
            where: { clientId: client.id },
            order: { createdAt: 'DESC' }
        });
        const totalSpent = sales.reduce((sum, s) => sum + Number(s.total), 0);
        const totalPoints = Math.floor(totalSpent / this.config.currencyUnit) * this.config.pointsPerUnit;
        // Simular puntos usados (en un sistema real, vendría de una tabla de canjes)
        const pointsUsed = Math.floor(totalPoints * 0.3); // Ejemplo: 30% usados
        const pointsAvailable = totalPoints - pointsUsed;
        // Determinar tier basado en gasto anual
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const annualSpent = sales
            .filter(s => new Date(s.createdAt) > oneYearAgo)
            .reduce((sum, s) => sum + Number(s.total), 0);
        let tier;
        if (annualSpent >= 5000)
            tier = 'Or';
        else if (annualSpent >= 2000)
            tier = 'Argent';
        else
            tier = 'Bronze';
        // Determinar estado
        const lastPurchase = sales[0]?.createdAt;
        const daysSinceLastPurchase = lastPurchase
            ? Math.floor((Date.now() - new Date(lastPurchase).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
        let status;
        if (daysSinceLastPurchase <= 30)
            status = 'active';
        else if (daysSinceLastPurchase <= 90)
            status = 'at-risk';
        else
            status = 'dormant';
        // Analizar categorías favoritas
        const categoryCount = {};
        for (const sale of sales) {
            if (sale.items) {
                for (const item of sale.items) {
                    if (item.product?.category) {
                        categoryCount[item.product.category] = (categoryCount[item.product.category] || 0) + 1;
                    }
                }
            }
        }
        const favoriteCategories = Object.entries(categoryCount)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return {
            clientId: client.id,
            clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sans nom',
            clientPhone: client.phone,
            totalSpent,
            totalPoints,
            pointsUsed,
            pointsAvailable,
            tier,
            lastPurchaseDate: lastPurchase || new Date(0),
            status,
            favoriteCategories
        };
    }
    // Obtener todos los puntos en circulación
    async getTotalPointsInCirculation() {
        const clients = await this.clientRepo.find();
        let totalPoints = 0;
        let totalPointsAvailable = 0;
        let totalPointsUsed = 0;
        let clientsWithPoints = 0;
        for (const client of clients) {
            try {
                const loyalty = await this.calculateClientPoints(client.id);
                totalPoints += loyalty.totalPoints;
                totalPointsAvailable += loyalty.pointsAvailable;
                totalPointsUsed += loyalty.pointsUsed;
                if (loyalty.totalPoints > 0)
                    clientsWithPoints++;
            }
            catch (error) {
                console.error(`Error calculating points for client ${client.id}:`, error);
            }
        }
        return {
            totalPoints,
            totalPointsAvailable,
            totalPointsUsed,
            clientsWithPoints
        };
    }
    // Identificar pacientes crónicos (medicamentos de uso recurrente)
    async getChronicPatients() {
        // Identificar medicamentos crónicos (simplificado - en producción usaríamos una tabla de clasificación)
        const chronicKeywords = ['antihypertenseur', 'antidiabétique', 'hypolipémiant', 'cardiaque', 'thyroïde'];
        const sales = await this.saleRepo.find({
            relations: ['items', 'items.product', 'client'],
            order: { createdAt: 'DESC' }
        });
        const patientMap = new Map();
        // Agrupar por cliente y recolectar medicamentos
        sales.forEach(sale => {
            if (!sale.client)
                return;
            const clientId = sale.client.id;
            if (!patientMap.has(clientId)) {
                patientMap.set(clientId, {
                    client: sale.client,
                    lastPurchase: sale.createdAt,
                    medications: new Set()
                });
            }
            const patient = patientMap.get(clientId);
            if (new Date(sale.createdAt) > new Date(patient.lastPurchase)) {
                patient.lastPurchase = sale.createdAt;
            }
            sale.items?.forEach(item => {
                const productName = item.product?.name?.toLowerCase() || '';
                if (chronicKeywords.some(keyword => productName.includes(keyword))) {
                    patient.medications.add(item.product?.name || 'Unknown');
                }
            });
        });
        const chronicPatients = [];
        const now = new Date();
        patientMap.forEach((patient, clientId) => {
            if (patient.medications.size > 0) {
                const daysSinceLastPurchase = Math.floor((now.getTime() - new Date(patient.lastPurchase).getTime()) / (1000 * 60 * 60 * 24));
                // Determinar riesgo
                let riskLevel;
                if (daysSinceLastPurchase <= 30)
                    riskLevel = 'low';
                else if (daysSinceLastPurchase <= 60)
                    riskLevel = 'medium';
                else
                    riskLevel = 'high';
                // Estimar próxima compra esperada (cada 30 días para crónicos)
                const nextExpectedPurchase = new Date(patient.lastPurchase);
                nextExpectedPurchase.setDate(nextExpectedPurchase.getDate() + 30);
                chronicPatients.push({
                    clientId,
                    clientName: `${patient.client.firstName || ''} ${patient.client.lastName || ''}`.trim() || 'Sans nom',
                    clientPhone: patient.client.phone || 'Non renseigné',
                    medication: Array.from(patient.medications).join(', '),
                    lastPurchaseDate: patient.lastPurchase,
                    daysSinceLastPurchase,
                    riskLevel,
                    nextExpectedPurchaseDate: nextExpectedPurchase
                });
            }
        });
        return chronicPatients.sort((a, b) => b.daysSinceLastPurchase - a.daysSinceLastPurchase);
    }
    // Obtener clientes dormidos (sin compras en 90+ días)
    async getDormantClients(days = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        // Primero obtenemos todos los clientes
        const clients = await this.clientRepo.find();
        const dormantClients = [];
        for (const client of clients) {
            // Buscar la última venta del cliente
            const lastSale = await this.saleRepo.findOne({
                where: { clientId: client.id },
                order: { createdAt: 'DESC' }
            });
            const lastPurchaseDate = lastSale?.createdAt || null;
            const daysSinceLastPurchase = lastPurchaseDate
                ? Math.floor((Date.now() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
                : days + 1;
            // Si no tiene ventas o la última venta es anterior al cutoff
            if (!lastPurchaseDate || daysSinceLastPurchase > days) {
                dormantClients.push({
                    id: client.id,
                    name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sans nom',
                    phone: client.phone || 'Non renseigné',
                    email: client.email,
                    lastPurchaseDate,
                    daysSinceLastPurchase
                });
            }
        }
        return dormantClients;
    }
    // Obtener análisis segmentado por tiers
    async getTierAnalysis() {
        const clients = await this.clientRepo.find();
        const tiers = {
            Bronze: { count: 0, totalSpent: 0, clients: [] },
            Argent: { count: 0, totalSpent: 0, clients: [] },
            Or: { count: 0, totalSpent: 0, clients: [] }
        };
        for (const client of clients) {
            try {
                const loyalty = await this.calculateClientPoints(client.id);
                tiers[loyalty.tier].count++;
                tiers[loyalty.tier].totalSpent += loyalty.totalSpent;
                tiers[loyalty.tier].clients.push({
                    id: client.id,
                    name: loyalty.clientName,
                    spent: loyalty.totalSpent
                });
            }
            catch (error) {
                console.error(`Error processing client ${client.id}:`, error);
            }
        }
        return {
            tiers,
            totalClients: clients.length,
            averageSpentByTier: {
                Bronze: tiers.Bronze.count > 0 ? tiers.Bronze.totalSpent / tiers.Bronze.count : 0,
                Argent: tiers.Argent.count > 0 ? tiers.Argent.totalSpent / tiers.Argent.count : 0,
                Or: tiers.Or.count > 0 ? tiers.Or.totalSpent / tiers.Or.count : 0
            }
        };
    }
    // Obtener categorías favoritas de clientes fieles (Or)
    async getFavoriteCategoriesByTier(tier) {
        const clients = await this.clientRepo.find();
        const categoryCount = {};
        for (const client of clients) {
            try {
                const loyalty = await this.calculateClientPoints(client.id);
                if (loyalty.tier === tier) {
                    loyalty.favoriteCategories.forEach(cat => {
                        categoryCount[cat.category] = (categoryCount[cat.category] || 0) + cat.count;
                    });
                }
            }
            catch (error) {
                console.error(`Error processing client ${client.id}:`, error);
            }
        }
        return Object.entries(categoryCount)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    // Resumen completo de fidelización
    async getLoyaltySummary() {
        const [points, chronic, dormant, tierAnalysis, favoriteCategories] = await Promise.all([
            this.getTotalPointsInCirculation(),
            this.getChronicPatients(),
            this.getDormantClients(),
            this.getTierAnalysis(),
            this.getFavoriteCategoriesByTier('Or')
        ]);
        return {
            points,
            chronic: {
                total: chronic.length,
                highRisk: chronic.filter(c => c.riskLevel === 'high').length,
                mediumRisk: chronic.filter(c => c.riskLevel === 'medium').length,
                lowRisk: chronic.filter(c => c.riskLevel === 'low').length,
                patients: chronic.slice(0, 10) // Top 10 para el dashboard
            },
            dormant: {
                total: dormant.length,
                clients: dormant.slice(0, 10) // Top 10 para el dashboard
            },
            tiers: tierAnalysis,
            favoriteCategories
        };
    }
}
exports.LoyaltyService = LoyaltyService;
exports.loyaltyService = new LoyaltyService();

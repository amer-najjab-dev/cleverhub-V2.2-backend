"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyService = exports.LoyaltyService = void 0;
const server_1 = require("../../server");
class LoyaltyService {
    constructor() {
        this.config = {
            pointsPerUnit: 1,
            currencyUnit: 10
        };
    }
    // Calcular puntos para un cliente
    async calculateClientPoints(clientId) {
        const client = await server_1.prisma.clients.findUnique({
            where: { id: clientId },
        });
        if (!client)
            throw new Error('Client not found');
        const sales = await server_1.prisma.sales.findMany({
            where: { client_id: clientId },
            include: {
                sale_items: {
                    include: {
                        products: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
        const totalSpent = sales.reduce((sum, s) => sum + Number(s.total), 0);
        const totalPoints = Math.floor(totalSpent / this.config.currencyUnit) * this.config.pointsPerUnit;
        // Simular puntos usados (en producción vendría de loyalty_transactions)
        const pointsUsed = Math.floor(totalPoints * 0.3);
        const pointsAvailable = totalPoints - pointsUsed;
        // Determinar tier basado en gasto anual
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const annualSpent = sales
            .filter((s) => new Date(s.created_at) > oneYearAgo)
            .reduce((sum, s) => sum + Number(s.total), 0);
        let tier;
        if (annualSpent >= 5000)
            tier = 'Or';
        else if (annualSpent >= 2000)
            tier = 'Argent';
        else
            tier = 'Bronze';
        // Determinar estado
        const lastPurchase = sales[0]?.created_at;
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
        sales.forEach((sale) => {
            sale.sale_items?.forEach((item) => {
                if (item.product?.category) {
                    categoryCount[item.product.category] = (categoryCount[item.product.category] || 0) + 1;
                }
            });
        });
        const favoriteCategories = Object.entries(categoryCount)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return {
            clientId: client.id,
            clientName: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Sans nom',
            clientPhone: client.phone || undefined,
            totalSpent,
            totalPoints,
            pointsUsed,
            pointsAvailable,
            tier,
            lastPurchaseDate: lastPurchase || new Date(0),
            status,
            favoriteCategories,
        };
    }
    // Obtener puntos en circulación
    async getTotalPointsInCirculation() {
        const clients = await server_1.prisma.clients.findMany();
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
            clientsWithPoints,
        };
    }
    // Identificar pacientes crónicos
    async getChronicPatients() {
        const chronicKeywords = ['antihypertenseur', 'antidiabétique', 'hypolipémiant', 'cardiaque', 'thyroïde'];
        const sales = await server_1.prisma.sales.findMany({
            include: {
                sale_items: {
                    include: {
                        products: true,
                    },
                },
                clients: true,
            },
            orderBy: { created_at: 'desc' },
        });
        const patientMap = new Map();
        sales.forEach((sale) => {
            if (!sale.client)
                return;
            const clientId = sale.client.id;
            if (!patientMap.has(clientId)) {
                patientMap.set(clientId, {
                    client: sale.client,
                    lastPurchase: sale.created_at,
                    medications: new Set(),
                });
            }
            const patient = patientMap.get(clientId);
            if (new Date(sale.created_at) > new Date(patient.lastPurchase)) {
                patient.lastPurchase = sale.created_at;
            }
            sale.sale_items?.forEach((item) => {
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
                let riskLevel;
                if (daysSinceLastPurchase <= 30)
                    riskLevel = 'low';
                else if (daysSinceLastPurchase <= 60)
                    riskLevel = 'medium';
                else
                    riskLevel = 'high';
                const nextExpectedPurchase = new Date(patient.lastPurchase);
                nextExpectedPurchase.setDate(nextExpectedPurchase.getDate() + 30);
                chronicPatients.push({
                    clientId,
                    clientName: `${patient.client.first_name || ''} ${patient.client.last_name || ''}`.trim() || 'Sans nom',
                    clientPhone: patient.client.phone || 'Non renseigné',
                    medication: Array.from(patient.medications).join(', '),
                    lastPurchaseDate: patient.lastPurchase,
                    daysSinceLastPurchase,
                    riskLevel,
                    nextExpectedPurchaseDate: nextExpectedPurchase,
                });
            }
        });
        return chronicPatients.sort((a, b) => b.daysSinceLastPurchase - a.daysSinceLastPurchase);
    }
    // Obtener clientes dormidos
    async getDormantClients(days = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const clients = await server_1.prisma.clients.findMany();
        const dormantClients = [];
        for (const client of clients) {
            const lastSale = await server_1.prisma.sales.findFirst({
                where: { client_id: client.id },
                orderBy: { created_at: 'desc' },
            });
            const lastPurchaseDate = lastSale?.created_at || null;
            const daysSinceLastPurchase = lastPurchaseDate
                ? Math.floor((Date.now() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
                : days + 1;
            if (!lastPurchaseDate || daysSinceLastPurchase > days) {
                dormantClients.push({
                    id: client.id,
                    name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Sans nom',
                    phone: client.phone || 'Non renseigné',
                    email: client.email,
                    lastPurchaseDate,
                    daysSinceLastPurchase,
                });
            }
        }
        return dormantClients;
    }
    // Análisis por tiers
    async getTierAnalysis() {
        const clients = await server_1.prisma.clients.findMany();
        const tiers = {
            Bronze: { count: 0, totalSpent: 0, clients: [] },
            Argent: { count: 0, totalSpent: 0, clients: [] },
            Or: { count: 0, totalSpent: 0, clients: [] },
        };
        for (const client of clients) {
            try {
                const loyalty = await this.calculateClientPoints(client.id);
                tiers[loyalty.tier].count++;
                tiers[loyalty.tier].totalSpent += loyalty.totalSpent;
                tiers[loyalty.tier].clients.push({
                    id: client.id,
                    name: loyalty.clientName,
                    spent: loyalty.totalSpent,
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
                Or: tiers.Or.count > 0 ? tiers.Or.totalSpent / tiers.Or.count : 0,
            },
        };
    }
    // Categorías favoritas de clientes Or
    async getFavoriteCategoriesByTier(tier) {
        const clients = await server_1.prisma.clients.findMany();
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
    // Resumen completo
    async getLoyaltySummary() {
        const [points, chronic, dormant, tierAnalysis, favoriteCategories] = await Promise.all([
            this.getTotalPointsInCirculation(),
            this.getChronicPatients(),
            this.getDormantClients(),
            this.getTierAnalysis(),
            this.getFavoriteCategoriesByTier('Or'),
        ]);
        return {
            points,
            chronic: {
                total: chronic.length,
                highRisk: chronic.filter(c => c.riskLevel === 'high').length,
                mediumRisk: chronic.filter(c => c.riskLevel === 'medium').length,
                lowRisk: chronic.filter(c => c.riskLevel === 'low').length,
                patients: chronic.slice(0, 10),
            },
            dormant: {
                total: dormant.length,
                clients: dormant.slice(0, 10),
            },
            tiers: tierAnalysis,
            favoriteCategories,
        };
    }
}
exports.LoyaltyService = LoyaltyService;
exports.loyaltyService = new LoyaltyService();

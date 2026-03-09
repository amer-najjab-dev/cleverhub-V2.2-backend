"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientIntelligenceService = exports.ClientIntelligenceService = void 0;
const data_source_1 = require("../../data-source");
const Client_1 = require("../../entities/Client");
const Sale_1 = require("../../entities/Sale");
const Payment_1 = require("../../entities/Payment");
class ClientIntelligenceService {
    constructor() {
        this.clientRepo = data_source_1.AppDataSource.getRepository(Client_1.Client);
        this.saleRepo = data_source_1.AppDataSource.getRepository(Sale_1.Sale);
        this.paymentRepo = data_source_1.AppDataSource.getRepository(Payment_1.Payment);
    }
    // Calcular score de riesgo para un cliente
    async calculateRiskScore(clientId) {
        const client = await this.clientRepo.findOne({ where: { id: clientId } });
        if (!client)
            throw new Error('Client not found');
        // Obtener compras del cliente
        const sales = await this.saleRepo.find({
            where: { clientId: client.id },
            order: { createdAt: 'DESC' }
        });
        const payments = await this.paymentRepo.find({
            where: { sale: { clientId: client.id } },
            relations: ['sale']
        });
        // Calcular métricas básicas
        const totalPurchases = sales.length;
        const totalSpent = sales.reduce((sum, s) => sum + Number(s.total), 0);
        const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
        // Score de pago (basado en pagos puntuales)
        let paymentScore = 100;
        let delayScore = 0;
        if (payments.length > 0) {
            const onTimePayments = payments.filter(p => {
                // Simplificación: asumimos que si hay pago, fue puntual
                return p.status === 'completed';
            });
            paymentScore = (onTimePayments.length / payments.length) * 100;
        }
        // Score de retraso (basado en facturas pendientes)
        const pendingSales = sales.filter(s => s.paymentStatus === 'pending');
        delayScore = pendingSales.length * 20; // Cada factura pendiente suma 20 puntos
        if (delayScore > 100)
            delayScore = 100;
        // Score de frecuencia (clientes que compran poco tienen más riesgo)
        const daysSinceLastPurchase = sales.length > 0
            ? Math.floor((Date.now() - new Date(sales[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : 365;
        let frequencyScore = 100;
        if (daysSinceLastPurchase > 180)
            frequencyScore = 20;
        else if (daysSinceLastPurchase > 90)
            frequencyScore = 40;
        else if (daysSinceLastPurchase > 60)
            frequencyScore = 60;
        else if (daysSinceLastPurchase > 30)
            frequencyScore = 80;
        // Riesgo global (promedio ponderado)
        const overallRisk = (paymentScore * 0.4 + (100 - delayScore) * 0.4 + frequencyScore * 0.2);
        let riskLevel;
        if (overallRisk >= 80)
            riskLevel = 'low';
        else if (overallRisk >= 60)
            riskLevel = 'medium';
        else if (overallRisk >= 40)
            riskLevel = 'high';
        else
            riskLevel = 'critical';
        // Generar recomendaciones
        const recommendations = [];
        if (pendingSales.length > 0) {
            recommendations.push(`${pendingSales.length} facture(s) en attente de paiement`);
        }
        if (daysSinceLastPurchase > 60) {
            recommendations.push('Client inactif depuis plus de 2 mois');
        }
        if (averageTicket > 1000) {
            recommendations.push('Client à fort potentiel, proposer des offres premium');
        }
        return {
            clientId: client.id,
            clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sans nom',
            clientPhone: client.phone,
            clientEmail: client.email,
            totalPurchases,
            totalSpent,
            averageTicket,
            paymentScore: Math.round(paymentScore),
            delayScore: Math.round(delayScore),
            frequencyScore: Math.round(frequencyScore),
            overallRisk: Math.round(overallRisk),
            riskLevel,
            recommendations
        };
    }
    // Calcular scores para todos los clientes
    async calculateAllRiskScores() {
        const clients = await this.clientRepo.find();
        const scores = await Promise.all(clients.map(c => this.calculateRiskScore(c.id).catch(() => null)));
        return scores.filter(s => s !== null);
    }
    // Segmentación automática de clientes
    async getClientSegments() {
        const scores = await this.calculateAllRiskScores();
        const segments = [
            {
                id: 'vip',
                name: 'Clients VIP',
                description: 'Meilleurs clients, haute valeur et fidélité',
                criteria: 'totalSpent > 5000 AND frequencyScore > 80',
                clientCount: 0,
                averageSpent: 0,
                color: 'purple'
            },
            {
                id: 'regular',
                name: 'Clients réguliers',
                description: 'Achats fréquents, bonne valeur',
                criteria: 'totalSpent BETWEEN 1000 AND 5000 AND frequencyScore > 60',
                clientCount: 0,
                averageSpent: 0,
                color: 'blue'
            },
            {
                id: 'occasional',
                name: 'Clients occasionnels',
                description: 'Achats esporadiques, valeur moyenne',
                criteria: 'totalSpent BETWEEN 100 AND 1000 OR frequencyScore BETWEEN 30 AND 60',
                clientCount: 0,
                averageSpent: 0,
                color: 'green'
            },
            {
                id: 'at-risk',
                name: 'Clients à risque',
                description: 'Risque de perdre ces clients (inactifs)',
                criteria: 'frequencyScore < 30 OR daysSinceLastPurchase > 90',
                clientCount: 0,
                averageSpent: 0,
                color: 'orange'
            },
            {
                id: 'critical',
                name: 'Clients en impayé',
                description: 'Risque élevé, factures impayées',
                criteria: 'delayScore > 50 OR overallRisk < 40',
                clientCount: 0,
                averageSpent: 0,
                color: 'red'
            }
        ];
        // Calcular métricas por segmento
        scores.forEach(score => {
            if (score.totalSpent > 5000 && score.frequencyScore > 80) {
                segments[0].clientCount++;
                segments[0].averageSpent += score.totalSpent;
            }
            else if (score.totalSpent > 1000 && score.frequencyScore > 60) {
                segments[1].clientCount++;
                segments[1].averageSpent += score.totalSpent;
            }
            else if (score.totalSpent > 100 || score.frequencyScore > 30) {
                segments[2].clientCount++;
                segments[2].averageSpent += score.totalSpent;
            }
            else if (score.frequencyScore < 30) {
                segments[3].clientCount++;
                segments[3].averageSpent += score.totalSpent;
            }
            else if (score.delayScore > 50 || score.overallRisk < 40) {
                segments[4].clientCount++;
                segments[4].averageSpent += score.totalSpent;
            }
        });
        // Calcular promedios
        segments.forEach(s => {
            s.averageSpent = s.clientCount > 0 ? Math.round(s.averageSpent / s.clientCount) : 0;
        });
        return segments;
    }
    // Analizar comportamiento de compra de un cliente
    async getPurchaseBehavior(clientId) {
        const client = await this.clientRepo.findOne({ where: { id: clientId } });
        if (!client)
            return null;
        const sales = await this.saleRepo.find({
            where: { clientId: client.id },
            relations: ['items', 'items.product'],
            order: { createdAt: 'ASC' }
        });
        if (sales.length === 0)
            return null;
        // Analizar categorías favoritas
        const categoryCount = {};
        const labCount = {};
        let totalItems = 0;
        sales.forEach(sale => {
            sale.items?.forEach(item => {
                if (item.product?.category) {
                    categoryCount[item.product.category] = (categoryCount[item.product.category] || 0) + 1;
                }
                if (item.product?.laboratory) {
                    labCount[item.product.laboratory] = (labCount[item.product.laboratory] || 0) + 1;
                }
                totalItems++;
            });
        });
        // Calcular frecuencias
        const firstPurchase = new Date(sales[0].createdAt);
        const lastPurchase = new Date(sales[sales.length - 1].createdAt);
        const daysDiff = Math.floor((lastPurchase.getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24));
        const avgDaysBetween = sales.length > 1 ? daysDiff / (sales.length - 1) : 0;
        let frequency;
        if (avgDaysBetween <= 7)
            frequency = 'daily';
        else if (avgDaysBetween <= 30)
            frequency = 'weekly';
        else if (avgDaysBetween <= 90)
            frequency = 'monthly';
        else if (avgDaysBetween <= 180)
            frequency = 'quarterly';
        else
            frequency = 'rare';
        // Método de pago preferido
        const paymentMethods = {};
        sales.forEach(s => {
            paymentMethods[s.paymentMethod] = (paymentMethods[s.paymentMethod] || 0) + 1;
        });
        const preferredMethod = Object.entries(paymentMethods)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
        // Hora preferida
        const hours = sales.map(s => new Date(s.createdAt).getHours());
        const preferredHour = hours.sort((a, b) => hours.filter(h => h === a).length - hours.filter(h => h === b).length).pop() || 12;
        return {
            clientId: client.id,
            clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sans nom',
            favoriteCategories: Object.entries(categoryCount)
                .map(([category, count]) => ({
                category,
                count,
                percentage: Math.round((count / totalItems) * 100)
            }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            favoriteLaboratories: Object.entries(labCount)
                .map(([laboratory, count]) => ({
                laboratory,
                count,
                percentage: Math.round((count / totalItems) * 100)
            }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            purchaseFrequency: frequency,
            averageDaysBetweenPurchases: Math.round(avgDaysBetween),
            lastPurchaseDate: lastPurchase,
            firstPurchaseDate: firstPurchase,
            preferredPaymentMethod: preferredMethod,
            preferredHour
        };
    }
    // Obtener resumen de inteligencia de clientes
    async getClientIntelligence() {
        const [scores, segments] = await Promise.all([
            this.calculateAllRiskScores(),
            this.getClientSegments()
        ]);
        const totalClients = scores.length;
        const totalRevenue = scores.reduce((sum, s) => sum + s.totalSpent, 0);
        const averagePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;
        const atRiskCount = scores.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length;
        return {
            totalClients,
            totalRevenue,
            averagePerClient,
            atRiskCount,
            atRiskPercentage: totalClients > 0 ? Math.round((atRiskCount / totalClients) * 100) : 0,
            segments
        };
    }
}
exports.ClientIntelligenceService = ClientIntelligenceService;
exports.clientIntelligenceService = new ClientIntelligenceService();

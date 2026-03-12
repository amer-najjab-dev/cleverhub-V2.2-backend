import { prisma } from '../../server';

export interface ClientRiskScore {
  clientId: number;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  totalPurchases: number;
  totalSpent: number;
  averageTicket: number;
  paymentScore: number; // 0-100
  delayScore: number; // 0-100
  frequencyScore: number; // 0-100
  overallRisk: number; // 0-100 (mayor = más riesgo)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface ClientSegment {
  id: string;
  name: string;
  description: string;
  criteria: string;
  clientCount: number;
  averageSpent: number;
  color: string;
}

export interface PurchaseBehavior {
  clientId: number;
  clientName: string;
  favoriteCategories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  favoriteLaboratories: {
    laboratory: string;
    count: number;
    percentage: number;
  }[];
  purchaseFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'rare';
  averageDaysBetweenPurchases: number;
  lastPurchaseDate: Date;
  firstPurchaseDate: Date;
  preferredPaymentMethod: string;
  preferredHour: number; // 0-23
}

export class ClientIntelligenceService {

  // Calcular score de riesgo para un cliente
  async calculateRiskScore(clientId: number): Promise<ClientRiskScore> {
    const client = await prisma.clients.findUnique({
      where: { id: clientId },
    });
    
    if (!client) throw new Error('Client not found');

    // Obtener compras del cliente
    const sales = await prisma.sales.findMany({
      where: { client_id: clientId },
      orderBy: { created_at: 'desc' },
    });

    const payments = await prisma.payments.findMany({
      where: {
        sale: {
          client_id: clientId,
        },
      },
      include: {
        sale: true,
      },
    });

    // Calcular métricas básicas
    const totalPurchases = sales.length;
    const totalSpent = sales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

    // Score de pago
    let paymentScore = 100;
    let delayScore = 0;

    if (payments.length > 0) {
      const onTimePayments = payments.filter((p: any) => p.status === 'completed');
      paymentScore = (onTimePayments.length / payments.length) * 100;
    }

    // Score de retraso
    const pendingSales = sales.filter((s: any) => s.payment_status === 'pending');
    delayScore = pendingSales.length * 20;
    if (delayScore > 100) delayScore = 100;

    // Score de frecuencia
    const daysSinceLastPurchase = sales.length > 0 && sales[0].created_at
  ? Math.floor((Date.now() - new Date(sales[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
  : 365;

    let frequencyScore = 100;
    if (daysSinceLastPurchase > 180) frequencyScore = 20;
    else if (daysSinceLastPurchase > 90) frequencyScore = 40;
    else if (daysSinceLastPurchase > 60) frequencyScore = 60;
    else if (daysSinceLastPurchase > 30) frequencyScore = 80;

    // Riesgo global
    const overallRisk = (paymentScore * 0.4 + (100 - delayScore) * 0.4 + frequencyScore * 0.2);
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (overallRisk >= 80) riskLevel = 'low';
    else if (overallRisk >= 60) riskLevel = 'medium';
    else if (overallRisk >= 40) riskLevel = 'high';
    else riskLevel = 'critical';

    // Recomendaciones
    const recommendations: string[] = [];
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
      clientName: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Sans nom',
      clientPhone: client.phone || undefined,
      clientEmail: client.email || undefined,
      totalPurchases,
      totalSpent,
      averageTicket,
      paymentScore: Math.round(paymentScore),
      delayScore: Math.round(delayScore),
      frequencyScore: Math.round(frequencyScore),
      overallRisk: Math.round(overallRisk),
      riskLevel,
      recommendations,
    };
  }

  // Calcular scores para todos los clientes
  async calculateAllRiskScores(): Promise<ClientRiskScore[]> {
    const clients = await prisma.clients.findMany();
    const scores = await Promise.all(
      clients.map((c: any) => this.calculateRiskScore(c.id).catch(() => null))
    );
    return scores.filter((s: any) => s !== null) as ClientRiskScore[];
  }

  // Segmentación automática
  async getClientSegments(): Promise<ClientSegment[]> {
    const scores = await this.calculateAllRiskScores();

    const segments: ClientSegment[] = [
      {
        id: 'vip',
        name: 'Clients VIP',
        description: 'Meilleurs clients, haute valeur et fidélité',
        criteria: 'totalSpent > 5000 AND frequencyScore > 80',
        clientCount: 0,
        averageSpent: 0,
        color: 'purple',
      },
      {
        id: 'regular',
        name: 'Clients réguliers',
        description: 'Achats fréquents, bonne valeur',
        criteria: 'totalSpent BETWEEN 1000 AND 5000 AND frequencyScore > 60',
        clientCount: 0,
        averageSpent: 0,
        color: 'blue',
      },
      {
        id: 'occasional',
        name: 'Clients occasionnels',
        description: 'Achats esporadiques, valeur moyenne',
        criteria: 'totalSpent BETWEEN 100 AND 1000 OR frequencyScore BETWEEN 30 AND 60',
        clientCount: 0,
        averageSpent: 0,
        color: 'green',
      },
      {
        id: 'at-risk',
        name: 'Clients à risque',
        description: 'Risque de perdre ces clients (inactifs)',
        criteria: 'frequencyScore < 30 OR daysSinceLastPurchase > 90',
        clientCount: 0,
        averageSpent: 0,
        color: 'orange',
      },
      {
        id: 'critical',
        name: 'Clients en impayé',
        description: 'Risque élevé, factures impayées',
        criteria: 'delayScore > 50 OR overallRisk < 40',
        clientCount: 0,
        averageSpent: 0,
        color: 'red',
      },
    ];

    scores.forEach((score: any) => {
      if (score.totalSpent > 5000 && score.frequencyScore > 80) {
        segments[0].clientCount++;
        segments[0].averageSpent += score.totalSpent;
      } else if (score.totalSpent > 1000 && score.frequencyScore > 60) {
        segments[1].clientCount++;
        segments[1].averageSpent += score.totalSpent;
      } else if (score.totalSpent > 100 || score.frequencyScore > 30) {
        segments[2].clientCount++;
        segments[2].averageSpent += score.totalSpent;
      } else if (score.frequencyScore < 30) {
        segments[3].clientCount++;
        segments[3].averageSpent += score.totalSpent;
      } else if (score.delayScore > 50 || score.overallRisk < 40) {
        segments[4].clientCount++;
        segments[4].averageSpent += score.totalSpent;
      }
    });

    segments.forEach((s: any) => {
      s.averageSpent = s.clientCount > 0 ? Math.round(s.averageSpent / s.clientCount) : 0;
    });

    return segments;
  }

  // Analizar comportamiento de compra
  async getPurchaseBehavior(clientId: number): Promise<PurchaseBehavior | null> {
    const client = await prisma.clients.findUnique({
      where: { id: clientId },
    });
    
    if (!client) return null;

    const sales = await prisma.sales.findMany({
      where: { client_id: clientId },
      include: {
        sale_items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    if (sales.length === 0) return null;

    const categoryCount: Record<string, number> = {};
    const labCount: Record<string, number> = {};
    let totalItems = 0;

    sales.forEach((sale: any) => {
      sale.sale_items?.forEach((item: any) => {
        if (item.product?.category) {
          categoryCount[item.product.category] = (categoryCount[item.product.category] || 0) + 1;
        }
        if (item.product?.laboratory) {
          labCount[item.product.laboratory] = (labCount[item.product.laboratory] || 0) + 1;
        }
        totalItems++;
      });
    });

    const firstPurchase = sales[0]?.created_at ? new Date(sales[0].created_at) : new Date();
    const lastPurchase = sales.length > 0 && sales[sales.length - 1]?.created_at 
    ? new Date(sales[sales.length - 1].created_at as string | Date) 
    : new Date();
    const daysDiff = Math.floor((lastPurchase.getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24));
    const avgDaysBetween = sales.length > 1 ? daysDiff / (sales.length - 1) : 0;

    let frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'rare';
    if (avgDaysBetween <= 7) frequency = 'daily';
    else if (avgDaysBetween <= 30) frequency = 'weekly';
    else if (avgDaysBetween <= 90) frequency = 'monthly';
    else if (avgDaysBetween <= 180) frequency = 'quarterly';
    else frequency = 'rare';

    const paymentMethods: Record<string, number> = {};
    sales.forEach((s: any) => {
      paymentMethods[s.payment_method] = (paymentMethods[s.payment_method] || 0) + 1;
    });
    const preferredMethod = Object.entries(paymentMethods)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    const hours: number[] = sales.map((s: any) => new Date(s.created_at).getHours());
    const preferredHour = hours.sort((a, b) => 
      hours.filter(h => h === a).length - hours.filter(h => h === b).length
    ).pop() || 12;

    return {
      clientId: client.id,
      clientName: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Sans nom',
      favoriteCategories: Object.entries(categoryCount)
        .map(([category, count]) => ({
          category,
          count,
          percentage: Math.round((count / totalItems) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      favoriteLaboratories: Object.entries(labCount)
        .map(([laboratory, count]) => ({
          laboratory,
          count,
          percentage: Math.round((count / totalItems) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      purchaseFrequency: frequency,
      averageDaysBetweenPurchases: Math.round(avgDaysBetween),
      lastPurchaseDate: lastPurchase,
      firstPurchaseDate: firstPurchase,
      preferredPaymentMethod: preferredMethod,
      preferredHour,
    };
  }

  // Obtener resumen de inteligencia
  async getClientIntelligence() {
    const [scores, segments] = await Promise.all([
      this.calculateAllRiskScores(),
      this.getClientSegments(),
    ]);

    const totalClients = scores.length;
    const totalRevenue = scores.reduce((sum: number, s: any) => sum + s.totalSpent, 0);
    const averagePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;
    const atRiskCount = scores.filter((s: any) => s.riskLevel === 'high' || s.riskLevel === 'critical').length;

    return {
      totalClients,
      totalRevenue,
      averagePerClient,
      atRiskCount,
      atRiskPercentage: totalClients > 0 ? Math.round((atRiskCount / totalClients) * 100) : 0,
      segments,
    };
  }
}

export const clientIntelligenceService = new ClientIntelligenceService();

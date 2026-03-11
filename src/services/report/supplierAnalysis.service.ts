import { prisma } from '../../server';

export interface SupplierAnalysisFilters {
  startDate: string;
  endDate: string;
  supplierIds?: string[];
}

export class SupplierAnalysisService {

  async getSupplierAnalysis(filters: SupplierAnalysisFilters) {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);

    // Validar fechas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Fechas inválidas');
    }

    // Construir where para proveedores
    const supplierWhere: any = {};
    if (filters.supplierIds && filters.supplierIds.length > 0) {
      supplierWhere.id = { in: filters.supplierIds };
    }

    // Obtener proveedores
    const suppliers = await prisma.suppliers.findMany({
      where: supplierWhere,
      orderBy: { company_name: 'asc' },
    });

    // Para cada proveedor, calcular métricas
    const analysis = await Promise.all(
      suppliers.map(async (supplier: any) => {
        // Compras del período
        const purchases = await prisma.product_purchases.findMany({
          where: {
            supplier_id: supplier.id,
            purchase_date: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            products: true,
          },
        });

        // Notas de crédito del período
        const creditNotes = await prisma.credit_notes.findMany({
          where: {
            supplier_id: supplier.id,
            issue_date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        // Totales
        const totalPurchases = purchases.reduce((sum: number, p: any) => 
          sum + (Number(p.price_pph) * p.quantity), 0);
        
        const totalCreditNotes = creditNotes.reduce((sum: number, c: any) => 
          sum + Number(c.total_amount), 0);

        const netSpending = totalPurchases - totalCreditNotes;
        
        // Análisis por producto
        const productMap = new Map();
        purchases.forEach((purchase: any) => {
          const productId = purchase.product_id;
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              productId,
              productName: purchase.products?.name || 'Unknown',
              productCode: purchase.products?.sku || 'N/A',
              quantities: [],
              prices: [],
              totalCost: 0,
            });
          }
          
          const product = productMap.get(productId);
          product.quantities.push(purchase.quantity);
          product.prices.push(Number(purchase.price_pph));
          product.totalCost += Number(purchase.price_pph) * purchase.quantity;
        });

        const products = Array.from(productMap.values()).map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          productCode: p.productCode,
          quantity: p.quantities.reduce((a: number, b: number) => a + b, 0),
          totalCost: p.totalCost,
          averagePrice: p.prices.length > 0 ? 
            p.prices.reduce((a: number, b: number) => a + b, 0) / p.prices.length : 0,
          lastPrice: p.prices.length > 0 ? p.prices[p.prices.length - 1] : 0,
          priceEvolution: p.prices.length > 1 ? 
            ((p.prices[p.prices.length - 1] - p.prices[0]) / p.prices[0]) * 100 : 0,
        }));

        // Desglose mensual
        const monthlyMap = new Map();
        
        purchases.forEach((purchase: any) => {
          const date = new Date(purchase.purchase_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
              month: monthKey,
              purchases: 0,
              creditNotes: 0,
            });
          }
          
          const monthData = monthlyMap.get(monthKey);
          monthData.purchases += Number(purchase.price_pph) * purchase.quantity;
        });

        creditNotes.forEach((creditNote: any) => {
          const date = new Date(creditNote.issue_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
              month: monthKey,
              purchases: 0,
              creditNotes: 0,
            });
          }
          
          const monthData = monthlyMap.get(monthKey);
          monthData.creditNotes += Number(creditNote.total_amount);
        });

        const monthlyBreakdown = Array.from(monthlyMap.values())
          .sort((a: any, b: any) => a.month.localeCompare(b.month));

        return {
          supplierId: supplier.id,
          supplierName: supplier.company_name,
          supplierCode: supplier.tax_id || 'N/A',
          totalPurchases,
          totalCreditNotes,
          netSpending,
          creditNotePercentage: totalPurchases > 0 ? 
            (totalCreditNotes / totalPurchases) * 100 : 0,
          products,
          monthlyBreakdown,
        };
      })
    );

    // Totales globales
    const totals = {
      totalPurchases: analysis.reduce((sum: number, a: any) => sum + a.totalPurchases, 0),
      totalCreditNotes: analysis.reduce((sum: number, a: any) => sum + a.totalCreditNotes, 0),
      netSpending: analysis.reduce((sum: number, a: any) => sum + a.netSpending, 0),
      averageCreditNotePercentage: analysis.length > 0 ?
        analysis.reduce((sum: number, a: any) => sum + a.creditNotePercentage, 0) / analysis.length : 0,
    };

    return {
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      summary: totals,
      suppliers: analysis,
    };
  }

  async getSupplierPurchaseHistory(supplierId: string, months: number = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const purchases = await prisma.product_purchases.findMany({
      where: {
        supplier_id: supplierId,
        purchase_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        products: true,
      },
      orderBy: {
        purchase_date: 'desc',
      },
    });

    return purchases.map((p: any) => ({
      id: p.id,
      date: p.purchase_date,
      productName: p.products?.name || 'Unknown',
      productCode: p.products?.sku || 'N/A',
      quantity: p.quantity,
      pricePPH: Number(p.price_pph),
      total: Number(p.price_pph) * p.quantity,
      batchNumber: p.batch_number,
      expiryDate: p.expiry_date,
      deliveryNoteId: p.delivery_note_id,
    }));
  }

  async getSupplierCreditNotes(supplierId: string, status?: string) {
    const where: any = { supplier_id: supplierId };
    if (status) {
      where.status = status;
    }

    const creditNotes = await prisma.credit_notes.findMany({
      where,
      orderBy: {
        issue_date: 'desc',
      },
    });

    return creditNotes.map((c: any) => ({
      id: c.id,
      reference: c.reference,
      issueDate: c.issue_date,
      totalAmount: Number(c.total_amount),
      usedAmount: Number(c.used_amount),
      remainingAmount: Number(c.remaining_amount),
      status: c.status,
      reason: c.reason,
      linkedBL: c.linked_bl,
      notes: c.notes,
    }));
  }
}

export const supplierAnalysisService = new SupplierAnalysisService();

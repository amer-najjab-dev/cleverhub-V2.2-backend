import { AppDataSource } from '../../data-source';
import { ProductPurchase } from '../../entities/ProductPurchase';
import { CreditNote } from '../../entities/CreditNote';
import { Supplier } from '../../entities/Supplier';
import { Between, In } from 'typeorm';

export interface SupplierAnalysisFilters {
  startDate: string;
  endDate: string;
  supplierIds?: string[];
}

export class SupplierAnalysisService {
  private purchaseRepo = AppDataSource.getRepository(ProductPurchase);
  private creditNoteRepo = AppDataSource.getRepository(CreditNote);
  private supplierRepo = AppDataSource.getRepository(Supplier);

  async getSupplierAnalysis(filters: SupplierAnalysisFilters) {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);

    // Validar que las fechas son válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Fechas inválidas');
    }

    // Construir where clause para proveedores
    const supplierWhere: any = {};
    if (filters.supplierIds && filters.supplierIds.length > 0) {
      supplierWhere.id = In(filters.supplierIds);
    }

    // Obtener proveedores
    const suppliers = await this.supplierRepo.find({
      where: supplierWhere,
      order: { companyName: 'ASC' }
    });

    // Para cada proveedor, calcular sus métricas
    const analysis = await Promise.all(
      suppliers.map(async (supplier) => {
        // Compras del período
        const purchases = await this.purchaseRepo.find({
          where: {
            supplierId: supplier.id,
            purchaseDate: Between(startDate, endDate)
          },
          relations: ['product']
        });

        // Notas de crédito del período
        const creditNotes = await this.creditNoteRepo.find({
          where: {
            supplierId: supplier.id,
            issueDate: Between(startDate, endDate)
          }
        });

        // Totales
        const totalPurchases = purchases.reduce((sum, p) => 
          sum + (Number(p.pricePPH) * p.quantity), 0);
        
        const totalCreditNotes = creditNotes.reduce((sum, c) => 
          sum + Number(c.totalAmount), 0);

        const netSpending = totalPurchases - totalCreditNotes;
        
        // Análisis por producto
        const productMap = new Map();
        purchases.forEach(purchase => {
          const productId = purchase.productId;
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              productId,
              productName: purchase.product?.name || 'Unknown',
              productCode: purchase.product?.sku || 'N/A',
              quantities: [],
              prices: [],
              totalCost: 0
            });
          }
          
          const product = productMap.get(productId);
          product.quantities.push(purchase.quantity);
          product.prices.push(Number(purchase.pricePPH));
          product.totalCost += Number(purchase.pricePPH) * purchase.quantity;
        });

        const products = Array.from(productMap.values()).map(p => ({
          productId: p.productId,
          productName: p.productName,
          productCode: p.productCode,
          quantity: p.quantities.reduce((a: number, b: number) => a + b, 0),
          totalCost: p.totalCost,
          averagePrice: p.prices.length > 0 ? 
            p.prices.reduce((a: number, b: number) => a + b, 0) / p.prices.length : 0,
          lastPrice: p.prices.length > 0 ? p.prices[p.prices.length - 1] : 0,
          priceEvolution: p.prices.length > 1 ? 
            ((p.prices[p.prices.length - 1] - p.prices[0]) / p.prices[0]) * 100 : 0
        }));

        // Desglose mensual
        const monthlyMap = new Map();
        
        // Procesar compras
        purchases.forEach(purchase => {
          const date = new Date(purchase.purchaseDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
              month: monthKey,
              purchases: 0,
              creditNotes: 0
            });
          }
          
          const monthData = monthlyMap.get(monthKey);
          monthData.purchases += Number(purchase.pricePPH) * purchase.quantity;
        });

        // Procesar notas de crédito
        creditNotes.forEach(creditNote => {
          const date = new Date(creditNote.issueDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
              month: monthKey,
              purchases: 0,
              creditNotes: 0
            });
          }
          
          const monthData = monthlyMap.get(monthKey);
          monthData.creditNotes += Number(creditNote.totalAmount);
        });

        const monthlyBreakdown = Array.from(monthlyMap.values())
          .sort((a, b) => a.month.localeCompare(b.month));

        return {
          supplierId: supplier.id,
          supplierName: supplier.companyName,
          supplierCode: supplier.taxId || 'N/A',
          totalPurchases,
          totalCreditNotes,
          netSpending,
          creditNotePercentage: totalPurchases > 0 ? 
            (totalCreditNotes / totalPurchases) * 100 : 0,
          products,
          monthlyBreakdown
        };
      })
    );

    // Totales globales
    const totals = {
      totalPurchases: analysis.reduce((sum, a) => sum + a.totalPurchases, 0),
      totalCreditNotes: analysis.reduce((sum, a) => sum + a.totalCreditNotes, 0),
      netSpending: analysis.reduce((sum, a) => sum + a.netSpending, 0),
      averageCreditNotePercentage: analysis.length > 0 ?
        analysis.reduce((sum, a) => sum + a.creditNotePercentage, 0) / analysis.length : 0
    };

    return {
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate
      },
      summary: totals,
      suppliers: analysis
    };
  }

  async getSupplierPurchaseHistory(supplierId: string, months: number = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const purchases = await this.purchaseRepo.find({
      where: {
        supplierId,
        purchaseDate: Between(startDate, endDate)
      },
      relations: ['product'],
      order: {
        purchaseDate: 'DESC'
      }
    });

    return purchases.map(p => ({
      id: p.id,
      date: p.purchaseDate,
      productName: p.product?.name || 'Unknown',
      productCode: p.product?.sku || 'N/A',
      quantity: p.quantity,
      pricePPH: Number(p.pricePPH),
      total: Number(p.pricePPH) * p.quantity,
      batchNumber: p.batchNumber,
      expiryDate: p.expiryDate,
      deliveryNoteId: p.deliveryNoteId
    }));
  }

  async getSupplierCreditNotes(supplierId: string, status?: string) {
    const where: any = { supplierId };
    if (status) {
      where.status = status;
    }

    const creditNotes = await this.creditNoteRepo.find({
      where,
      order: {
        issueDate: 'DESC'
      }
    });

    return creditNotes.map(c => ({
      id: c.id,
      reference: c.reference,
      issueDate: c.issueDate,
      totalAmount: Number(c.totalAmount),
      usedAmount: Number(c.usedAmount),
      remainingAmount: Number(c.remainingAmount),
      status: c.status,
      reason: c.reason,
      linkedBL: c.linkedBL,
      notes: c.notes
    }));
  }
}

export const supplierAnalysisService = new SupplierAnalysisService();

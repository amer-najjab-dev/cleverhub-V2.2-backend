"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierAnalysisService = exports.SupplierAnalysisService = void 0;
const data_source_1 = require("../../data-source");
const ProductPurchase_1 = require("../../entities/ProductPurchase");
const CreditNote_1 = require("../../entities/CreditNote");
const Supplier_1 = require("../../entities/Supplier");
const typeorm_1 = require("typeorm");
class SupplierAnalysisService {
    constructor() {
        this.purchaseRepo = data_source_1.AppDataSource.getRepository(ProductPurchase_1.ProductPurchase);
        this.creditNoteRepo = data_source_1.AppDataSource.getRepository(CreditNote_1.CreditNote);
        this.supplierRepo = data_source_1.AppDataSource.getRepository(Supplier_1.Supplier);
    }
    async getSupplierAnalysis(filters) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        // Validar que las fechas son válidas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Fechas inválidas');
        }
        // Construir where clause para proveedores
        const supplierWhere = {};
        if (filters.supplierIds && filters.supplierIds.length > 0) {
            supplierWhere.id = (0, typeorm_1.In)(filters.supplierIds);
        }
        // Obtener proveedores
        const suppliers = await this.supplierRepo.find({
            where: supplierWhere,
            order: { companyName: 'ASC' }
        });
        // Para cada proveedor, calcular sus métricas
        const analysis = await Promise.all(suppliers.map(async (supplier) => {
            // Compras del período
            const purchases = await this.purchaseRepo.find({
                where: {
                    supplierId: supplier.id,
                    purchaseDate: (0, typeorm_1.Between)(startDate, endDate)
                },
                relations: ['product']
            });
            // Notas de crédito del período
            const creditNotes = await this.creditNoteRepo.find({
                where: {
                    supplierId: supplier.id,
                    issueDate: (0, typeorm_1.Between)(startDate, endDate)
                }
            });
            // Totales
            const totalPurchases = purchases.reduce((sum, p) => sum + (Number(p.pricePPH) * p.quantity), 0);
            const totalCreditNotes = creditNotes.reduce((sum, c) => sum + Number(c.totalAmount), 0);
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
                quantity: p.quantities.reduce((a, b) => a + b, 0),
                totalCost: p.totalCost,
                averagePrice: p.prices.length > 0 ?
                    p.prices.reduce((a, b) => a + b, 0) / p.prices.length : 0,
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
        }));
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
    async getSupplierPurchaseHistory(supplierId, months = 6) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        const purchases = await this.purchaseRepo.find({
            where: {
                supplierId,
                purchaseDate: (0, typeorm_1.Between)(startDate, endDate)
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
    async getSupplierCreditNotes(supplierId, status) {
        const where = { supplierId };
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
exports.SupplierAnalysisService = SupplierAnalysisService;
exports.supplierAnalysisService = new SupplierAnalysisService();

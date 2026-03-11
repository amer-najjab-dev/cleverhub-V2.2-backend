"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierAnalysisService = exports.SupplierAnalysisService = void 0;
class SupplierAnalysisService {
    async getSupplierAnalysis(filters) {
        return {
            period: filters,
            summary: {
                totalPurchases: 0,
                totalCreditNotes: 0,
                netSpending: 0,
                averageCreditNotePercentage: 0
            },
            suppliers: []
        };
    }
    async getSupplierPurchaseHistory(supplierId, months = 6) {
        return [];
    }
    async getSupplierCreditNotes(supplierId, status) {
        return [];
    }
}
exports.SupplierAnalysisService = SupplierAnalysisService;
exports.supplierAnalysisService = new SupplierAnalysisService();

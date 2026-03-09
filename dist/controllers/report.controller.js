"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = exports.ReportController = void 0;
const report_service_1 = require("../services/report/report.service");
const supplierAnalysis_service_1 = require("../services/report/supplierAnalysis.service");
class ReportController {
    // ========== CIERRE DE CAJA ==========
    async getCashClosure(req, res) {
        try {
            const { date } = req.query;
            const userId = req.session.userId;
            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: 'Date requise'
                });
            }
            const closure = await report_service_1.reportService.getCashClosure(date, userId);
            res.json({
                success: true,
                data: closure
            });
        }
        catch (error) {
            console.error('Error getting cash closure:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async validateClosure(req, res) {
        try {
            const result = await report_service_1.reportService.validateClosure(req.body);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async resolveDiscrepancy(req, res) {
        try {
            const result = await report_service_1.reportService.resolveDiscrepancy(req.body);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    // ========== BUSINESS INTELLIGENCE ==========
    async getDashboardKPIs(req, res) {
        try {
            const { period } = req.query;
            const kpis = await report_service_1.reportService.getDashboardKPIs(period);
            res.json({
                success: true,
                data: kpis
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getSalesTrend(req, res) {
        try {
            const { period } = req.query;
            const data = await report_service_1.reportService.getSalesTrend(period);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getTopProducts(req, res) {
        try {
            const { limit, period } = req.query;
            const data = await report_service_1.reportService.getTopProducts(limit ? parseInt(limit) : 10, period);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getLostSales(req, res) {
        try {
            const { period } = req.query;
            const data = await report_service_1.reportService.getLostSales(period);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    // ========== ANÁLISIS DE PROVEEDORES ==========
    async getSupplierAnalysis(req, res) {
        try {
            const { startDate, endDate, supplierIds } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Les dates de début et fin sont requises'
                });
            }
            const filters = {
                startDate: startDate,
                endDate: endDate
            };
            // CORREGIDO: Manejar supplierIds correctamente
            if (supplierIds) {
                if (typeof supplierIds === 'string') {
                    // Si es string (formato comma-separated)
                    filters.supplierIds = supplierIds.split(',');
                }
                else if (Array.isArray(supplierIds)) {
                    // Si ya es un array
                    filters.supplierIds = supplierIds;
                }
            }
            const analysis = await supplierAnalysis_service_1.supplierAnalysisService.getSupplierAnalysis(filters);
            res.json({
                success: true,
                data: analysis
            });
        }
        catch (error) {
            console.error('Error getting supplier analysis:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getSupplierPurchaseHistory(req, res) {
        try {
            const { supplierId } = req.params;
            const { months } = req.query;
            if (!supplierId) {
                return res.status(400).json({
                    success: false,
                    message: 'Supplier ID est requis'
                });
            }
            const history = await supplierAnalysis_service_1.supplierAnalysisService.getSupplierPurchaseHistory(supplierId, months ? parseInt(months) : 6);
            res.json({
                success: true,
                data: history
            });
        }
        catch (error) {
            console.error('Error getting purchase history:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getSupplierCreditNotes(req, res) {
        try {
            const { supplierId } = req.params;
            const { status } = req.query;
            if (!supplierId) {
                return res.status(400).json({
                    success: false,
                    message: 'Supplier ID est requis'
                });
            }
            const creditNotes = await supplierAnalysis_service_1.supplierAnalysisService.getSupplierCreditNotes(supplierId, status);
            res.json({
                success: true,
                data: creditNotes
            });
        }
        catch (error) {
            console.error('Error getting credit notes:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.ReportController = ReportController;
exports.reportController = new ReportController();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierController = exports.SupplierController = void 0;
const supplier_service_1 = require("../services/supplier/supplier.service");
class SupplierController {
    async getAll(req, res) {
        try {
            const { search } = req.query;
            const filters = {};
            if (search)
                filters.search = search;
            const suppliers = await supplier_service_1.supplierService.getAll(filters);
            res.json({
                success: true,
                data: suppliers
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const supplier = await supplier_service_1.supplierService.getById(id);
            if (!supplier) {
                return res.status(404).json({
                    success: false,
                    message: 'Fournisseur non trouvé'
                });
            }
            res.json({
                success: true,
                data: supplier
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async search(req, res) {
        try {
            const { q } = req.query;
            const suppliers = await supplier_service_1.supplierService.search(q);
            res.json({
                success: true,
                data: suppliers
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async create(req, res) {
        try {
            const supplier = await supplier_service_1.supplierService.create(req.body);
            res.status(201).json({
                success: true,
                data: supplier
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const supplier = await supplier_service_1.supplierService.update(id, req.body);
            res.json({
                success: true,
                data: supplier
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await supplier_service_1.supplierService.delete(id);
            res.json({
                success: true,
                message: 'Fournisseur supprimé avec succès'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.SupplierController = SupplierController;
exports.supplierController = new SupplierController();

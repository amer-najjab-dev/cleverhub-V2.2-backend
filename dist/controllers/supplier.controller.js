"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierController = exports.SupplierController = void 0;
const server_1 = require("../server");
const client_1 = require("@prisma/client");
class SupplierController {
    async getAll(req, res) {
        try {
            const suppliers = await server_1.prisma.suppliers.findMany({
                orderBy: { company_name: 'asc' }
            });
            res.json({ success: true, data: suppliers });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const supplier = await server_1.prisma.suppliers.findUnique({
                where: { id: id }
            });
            if (!supplier) {
                return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
            }
            res.json({ success: true, data: supplier });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async search(req, res) {
        try {
            const { q } = req.query;
            const where = q ? {
                company_name: { contains: q, mode: client_1.Prisma.QueryMode.insensitive }
            } : {};
            const suppliers = await server_1.prisma.suppliers.findMany({
                where,
                take: 20,
                orderBy: { company_name: 'asc' }
            });
            res.json({ success: true, data: suppliers });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async create(req, res) {
        try {
            // CORREGIDO: Usando SOLO los campos que existen en el modelo
            const data = {
                company_name: req.body.name,
            };
            // Añadir campos opcionales solo si existen
            if (req.body.email)
                data.email = req.body.email;
            if (req.body.website)
                data.website = req.body.website;
            if (req.body.fax)
                data.fax = req.body.fax;
            if (req.body.payment_terms)
                data.payment_terms = req.body.paymentTerms;
            if (req.body.tax_id)
                data.tax_id = req.body.taxId;
            if (req.body.registration_number)
                data.registration_number = req.body.registrationNumber;
            if (req.body.notes)
                data.notes = req.body.notes;
            // NOTA: El modelo NO tiene contact_person, phone, address
            // Si necesitas estos campos, deberás agregarlos al modelo primero
            const supplier = await server_1.prisma.suppliers.create({
                data
            });
            res.status(201).json({ success: true, data: supplier });
        }
        catch (error) {
            console.error('Error creating supplier:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            // CORREGIDO: Usando SOLO los campos que existen en el modelo
            const data = {};
            if (req.body.name)
                data.company_name = req.body.name;
            if (req.body.email)
                data.email = req.body.email;
            if (req.body.website)
                data.website = req.body.website;
            if (req.body.fax)
                data.fax = req.body.fax;
            if (req.body.payment_terms)
                data.payment_terms = req.body.paymentTerms;
            if (req.body.tax_id)
                data.tax_id = req.body.taxId;
            if (req.body.registration_number)
                data.registration_number = req.body.registrationNumber;
            if (req.body.notes)
                data.notes = req.body.notes;
            const supplier = await server_1.prisma.suppliers.update({
                where: { id: id },
                data
            });
            res.json({ success: true, data: supplier });
        }
        catch (error) {
            console.error('Error updating supplier:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await server_1.prisma.suppliers.delete({ where: { id: id } });
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error deleting supplier:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.SupplierController = SupplierController;
exports.supplierController = new SupplierController();

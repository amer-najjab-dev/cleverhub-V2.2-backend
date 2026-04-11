"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierController = exports.SupplierController = void 0;
const server_1 = require("../server");
const client_1 = require("@prisma/client");
class SupplierController {
    async getAll(req, res) {
        try {
            const pharmacyId = req.user?.pharmacyId;
            const suppliers = await server_1.prisma.suppliers.findMany({
                where: pharmacyId ? { pharmacy_id: pharmacyId } : {},
                include: {
                    supplier_phones: true,
                    supplier_addresses: true
                },
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
                where: { id: id },
                include: {
                    supplier_phones: true,
                    supplier_addresses: true
                }
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
        console.log("📦 req.body completo:", JSON.stringify(req.body, null, 2));
        try {
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const { company_name, email, phone, address, city, postalCode, paymentTerms, taxId, notes } = req.body;
            const result = await server_1.prisma.$transaction(async (tx) => {
                console.log("🔍 Valor de name:", company_name);
                console.log("🔍 Valor de req.body.name:", req.body.name);
                console.log("🔍 req.body completo:", JSON.stringify(req.body, null, 2));
                const supplier = await tx.suppliers.create({
                    data: {
                        company_name: company_name,
                        pharmacy_id: pharmacyId,
                        email: email,
                        payment_terms: req.body.payment_terms,
                        tax_id: req.body.tax_id,
                        notes: notes,
                    }
                });
                if (phone) {
                    await tx.supplier_phones.create({
                        data: {
                            supplier_id: supplier.id,
                            number: phone,
                            type: 'order',
                            is_primary: true,
                        }
                    });
                }
                if (address || city) {
                    await tx.supplier_addresses.create({
                        data: {
                            supplier_id: supplier.id,
                            street_name: address || '',
                            city: city || '',
                            postal_code: postalCode,
                            country: 'Maroc',
                            is_primary: true,
                        }
                    });
                }
                return supplier;
            });
            res.status(201).json({ success: true, data: result });
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pharmacyController = void 0;
const server_1 = require("../server");
exports.pharmacyController = {
    // Obtener todas las farmacias (solo SUPER_ADMIN)
    getAll: async (req, res) => {
        try {
            const pharmacies = await server_1.prisma.pharmacy.findMany({
                include: {
                    _count: {
                        select: { users: true, sales: true, clients: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });
            res.json({ success: true, data: pharmacies });
        }
        catch (error) {
            console.error('Error getting pharmacies:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Crear nueva farmacia (solo SUPER_ADMIN)
    create: async (req, res) => {
        try {
            const { name, license, address, phone, email } = req.body;
            const pharmacy = await server_1.prisma.pharmacy.create({
                data: {
                    name,
                    license,
                    address,
                    phone,
                    email,
                    is_active: true
                }
            });
            res.status(201).json({ success: true, data: pharmacy });
        }
        catch (error) {
            console.error('Error creating pharmacy:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Actualizar farmacia
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, license, address, phone, email, is_active } = req.body;
            const pharmacy = await server_1.prisma.pharmacy.update({
                where: { id: parseInt(id) },
                data: { name, license, address, phone, email, is_active }
            });
            res.json({ success: true, data: pharmacy });
        }
        catch (error) {
            console.error('Error updating pharmacy:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Eliminar farmacia (solo SUPER_ADMIN)
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await server_1.prisma.pharmacy.delete({
                where: { id: parseInt(id) }
            });
            res.json({ success: true, message: 'Farmacia eliminada correctamente' });
        }
        catch (error) {
            console.error('Error deleting pharmacy:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Obtener una farmacia por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const pharmacy = await server_1.prisma.pharmacy.findUnique({
                where: { id: parseInt(id) },
                include: {
                    _count: {
                        select: { users: true, sales: true, clients: true }
                    }
                }
            });
            if (!pharmacy) {
                return res.status(404).json({ success: false, message: 'Farmacia no encontrada' });
            }
            res.json({ success: true, data: pharmacy });
        }
        catch (error) {
            console.error('Error getting pharmacy:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

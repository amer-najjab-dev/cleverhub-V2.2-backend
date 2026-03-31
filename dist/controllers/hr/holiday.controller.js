"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.holidayController = void 0;
const server_1 = require("../../server");
exports.holidayController = {
    // Obtener todos los festivos de la farmacia
    getAll: async (req, res) => {
        try {
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const holidays = await server_1.prisma.holidays.findMany({
                where: { pharmacy_id: pharmacyId },
                orderBy: { date: 'asc' }
            });
            res.json({ success: true, data: holidays });
        }
        catch (error) {
            console.error('Error getting holidays:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Crear nuevo festivo
    create: async (req, res) => {
        try {
            const { name, date, isRecurring } = req.body;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const holiday = await server_1.prisma.holidays.create({
                data: {
                    name,
                    date: new Date(date),
                    is_recurring: isRecurring || false,
                    pharmacy_id: pharmacyId
                }
            });
            res.status(201).json({ success: true, data: holiday });
        }
        catch (error) {
            console.error('Error creating holiday:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Eliminar festivo
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            await server_1.prisma.holidays.delete({
                where: {
                    id: parseInt(id),
                    pharmacy_id: pharmacyId
                }
            });
            res.json({ success: true, message: 'Holiday deleted' });
        }
        catch (error) {
            console.error('Error deleting holiday:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

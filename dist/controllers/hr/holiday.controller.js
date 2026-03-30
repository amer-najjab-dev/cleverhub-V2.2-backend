"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.holidayController = void 0;
const server_1 = require("../../server");
exports.holidayController = {
    // Obtener todos los festivos
    getAll: async (req, res) => {
        try {
            const holidays = await server_1.prisma.holidays.findMany({
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
            const holiday = await server_1.prisma.holidays.create({
                data: {
                    name,
                    date: new Date(date),
                    is_recurring: isRecurring || false
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
            await server_1.prisma.holidays.delete({
                where: { id: parseInt(id) }
            });
            res.json({ success: true, message: 'Holiday deleted' });
        }
        catch (error) {
            console.error('Error deleting holiday:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

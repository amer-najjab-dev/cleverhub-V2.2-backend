"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardController = void 0;
const server_1 = require("../../server");
exports.guardController = {
    // Obtener todos los periodos de guardia
    getPeriods: async (req, res) => {
        try {
            const periods = await server_1.prisma.guard_schedules.findMany({
                include: {
                    shift: true
                },
                orderBy: { start_date: 'asc' }
            });
            // Formatear respuesta
            const formatted = periods.map(p => ({
                id: p.id,
                shift_id: p.shift_id,
                shift_name: p.shift?.name,
                start_date: p.start_date,
                end_date: p.end_date,
                created_at: p.created_at,
                updated_at: p.updated_at
            }));
            res.json({ success: true, data: formatted });
        }
        catch (error) {
            console.error('Error getting guard periods:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Crear nuevo periodo de guardia
    createPeriod: async (req, res) => {
        try {
            const { shiftId, startDate, endDate } = req.body;
            const period = await server_1.prisma.guard_schedules.create({
                data: {
                    shift_id: shiftId,
                    start_date: new Date(startDate),
                    end_date: new Date(endDate)
                }
            });
            res.status(201).json({ success: true, data: period });
        }
        catch (error) {
            console.error('Error creating guard period:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Eliminar periodo de guardia
    deletePeriod: async (req, res) => {
        try {
            const { id } = req.params;
            await server_1.prisma.guard_schedules.delete({
                where: { id: parseInt(id) }
            });
            res.json({ success: true, message: 'Guard period deleted' });
        }
        catch (error) {
            console.error('Error deleting guard period:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftController = void 0;
const server_1 = require("../../server");
exports.shiftController = {
    getAll: async (req, res) => {
        try {
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const shifts = await server_1.prisma.shifts.findMany({
                where: { pharmacy_id: pharmacyId },
                include: {
                    pharmacy_configs: true
                },
                orderBy: { id: 'asc' }
            });
            const formattedShifts = shifts.map(shift => ({
                id: shift.id,
                name: shift.name,
                start_time: shift.start_time,
                end_time: shift.end_time,
                is_guard: shift.is_guard,
                min_employees_required: shift.pharmacy_configs?.[0]?.min_employees_required ?? shift.min_employees_required,
                created_at: shift.created_at,
                updated_at: shift.updated_at
            }));
            res.json({ success: true, data: formattedShifts });
        }
        catch (error) {
            console.error('Error getting shifts:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const { name, startTime, endTime, isGuard, minEmployeesRequired } = req.body;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const shift = await server_1.prisma.shifts.create({
                data: {
                    name,
                    start_time: startTime,
                    end_time: endTime,
                    is_guard: isGuard || false,
                    min_employees_required: minEmployeesRequired || 1,
                    pharmacy_id: pharmacyId
                }
            });
            await server_1.prisma.pharmacy_configs.create({
                data: {
                    shift_id: shift.id,
                    min_employees_required: minEmployeesRequired || 1
                }
            });
            res.status(201).json({ success: true, data: shift });
        }
        catch (error) {
            console.error('Error creating shift:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, startTime, endTime, isGuard, minEmployeesRequired } = req.body;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const shift = await server_1.prisma.shifts.update({
                where: { id: parseInt(id), pharmacy_id: pharmacyId },
                data: {
                    name,
                    start_time: startTime,
                    end_time: endTime,
                    is_guard: isGuard,
                    min_employees_required: minEmployeesRequired
                }
            });
            await server_1.prisma.pharmacy_configs.update({
                where: { shift_id: parseInt(id) },
                data: { min_employees_required: minEmployeesRequired }
            });
            res.json({ success: true, data: shift });
        }
        catch (error) {
            console.error('Error updating shift:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const employeesWithShift = await server_1.prisma.employees.count({
                where: { default_shift_id: parseInt(id), pharmacy_id: pharmacyId }
            });
            if (employeesWithShift > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar el turno porque hay empleados asignados'
                });
            }
            await server_1.prisma.shifts.delete({
                where: { id: parseInt(id), pharmacy_id: pharmacyId }
            });
            res.json({ success: true, message: 'Shift deleted' });
        }
        catch (error) {
            console.error('Error deleting shift:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getConfig: async (req, res) => {
        try {
            const { shiftId } = req.params;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
            }
            const config = await server_1.prisma.pharmacy_configs.upsert({
                where: { shift_id: parseInt(shiftId) },
                update: {},
                create: {
                    shift_id: parseInt(shiftId),
                    min_employees_required: 1
                }
            });
            res.json({ success: true, data: config });
        }
        catch (error) {
            console.error('Error getting shift config:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

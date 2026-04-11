"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coverageController = void 0;
const server_1 = require("../../server");
exports.coverageController = {
    getCoverage: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            const shifts = await server_1.prisma.shifts.findMany();
            const assignments = await server_1.prisma.shift_assignments.findMany({
                where: {
                    date: {
                        gte: start,
                        lte: end
                    }
                }
            });
            // Obtener todos los empleados involucrados en las asignaciones
            const employeeIds = [...new Set(assignments.map(a => a.employee_id))];
            // Obtener empleados con sus user_id
            const employees = await server_1.prisma.employees.findMany({
                where: { id: { in: employeeIds } },
                select: { id: true, user_id: true }
            });
            // Obtener usuarios directamente por user_id
            const userIds = employees.map(e => e.user_id);
            const users = await server_1.prisma.users.findMany({
                where: { id: { in: userIds } },
                select: { id: true, full_name: true, email: true }
            });
            // Crear mapa de empleados con sus usuarios
            const userMap = new Map();
            users.forEach(u => userMap.set(u.id, u));
            const employeeMap = new Map();
            employees.forEach(emp => {
                const user = userMap.get(emp.user_id);
                employeeMap.set(emp.id, {
                    id: emp.id,
                    name: user?.full_name || `Empleado ${emp.id}`,
                    email: user?.email
                });
            });
            const approvedRequests = await server_1.prisma.time_off_requests.findMany({
                where: {
                    status: 'approved',
                    start_date: { lte: end },
                    end_date: { gte: start }
                }
            });
            const guardPeriods = await server_1.prisma.guard_schedules.findMany({
                where: {
                    OR: [
                        { start_date: { lte: end, gte: start } },
                        { end_date: { lte: end, gte: start } },
                        { start_date: { lte: start }, end_date: { gte: end } }
                    ]
                }
            });
            const coverage = [];
            const currentDate = new Date(start);
            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split('T')[0];
                for (const shift of shifts) {
                    // Para turnos de guardia, solo incluir si hay período activo
                    if (shift.is_guard) {
                        const isGuardActive = guardPeriods.some(period => period.start_date <= currentDate && period.end_date >= currentDate && period.shift_id === shift.id);
                        if (!isGuardActive)
                            continue;
                    }
                    // Empleados asignados a este turno en esta fecha
                    const assignedEmployeeIds = assignments
                        .filter(a => a.shift_id === shift.id && a.date.toISOString().split('T')[0] === dateStr)
                        .map(a => a.employee_id);
                    // Empleados de vacaciones en esta fecha
                    const vacationEmployeeIds = approvedRequests
                        .filter(r => r.start_date <= currentDate && r.end_date >= currentDate)
                        .map(r => r.employee_id);
                    // Empleados disponibles (asignados y no de vacaciones)
                    const availableEmployeeIds = assignedEmployeeIds.filter(id => !vacationEmployeeIds.includes(id));
                    const availableCount = availableEmployeeIds.length;
                    // Formatear empleados para la respuesta
                    const formattedEmployees = availableEmployeeIds.map(id => ({
                        id,
                        name: employeeMap.get(id)?.name || `Empleado ${id}`,
                        email: employeeMap.get(id)?.email
                    }));
                    coverage.push({
                        date: dateStr,
                        shiftId: shift.id,
                        shiftName: shift.name,
                        currentCount: availableCount,
                        requiredMin: shift.min_employees_required,
                        employees: formattedEmployees
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            res.json({ success: true, data: coverage });
        }
        catch (error) {
            console.error('Error getting coverage:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

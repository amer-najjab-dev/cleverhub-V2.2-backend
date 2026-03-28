import { Request, Response } from 'express';
import { prisma } from '../../server';

export const coverageController = {
  // Obtener cobertura por rango de fechas
  getCoverage: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      // Obtener todos los turnos
      const shifts = await prisma.shifts.findMany();
      
      // Obtener todas las asignaciones de turno
      const assignments = await prisma.shift_assignments.findMany({
        where: {
          date: {
            gte: start,
            lte: end
          }
        }
      });
      
      // Obtener solicitudes aprobadas
      const approvedRequests = await prisma.time_off_requests.findMany({
        where: {
          status: 'approved',
          start_date: { lte: end },
          end_date: { gte: start }
        }
      });
      
      // Obtener guardias programadas
      const guardPeriods = await prisma.guard_schedules.findMany({
        where: {
          OR: [
            { start_date: { lte: end, gte: start } },
            { end_date: { lte: end, gte: start } },
            { start_date: { lte: start }, end_date: { gte: end } }
          ]
        }
      });
      
      // Calcular cobertura por día
      const coverage: any[] = [];
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        for (const shift of shifts) {
          // Verificar si es guardia y está programada
          if (shift.is_guard) {
            const isGuardActive = guardPeriods.some(period => 
              period.start_date <= currentDate && period.end_date >= currentDate && period.shift_id === shift.id
            );
            if (!isGuardActive) continue;
          }
          
          // Empleados asignados a este turno en esta fecha
          const assignedEmployees = assignments.filter(a => 
            a.shift_id === shift.id && a.date.toISOString().split('T')[0] === dateStr
          ).map(a => a.employee_id);
          
          // Empleados de vacaciones en esta fecha
          const vacationEmployees = approvedRequests.filter(r => 
            r.start_date <= currentDate && r.end_date >= currentDate
          ).map(r => r.employee_id);
          
          // Empleados disponibles
          const availableCount = assignedEmployees.filter(id => !vacationEmployees.includes(id)).length;
          
          coverage.push({
            date: dateStr,
            shiftId: shift.id,
            shiftName: shift.name,
            currentCount: availableCount,
            requiredMin: shift.min_employees_required,
            employees: []
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      res.json({ success: true, data: coverage });
    } catch (error: any) {
      console.error('Error getting coverage:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
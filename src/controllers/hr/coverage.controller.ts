import { Request, Response } from 'express';
import { prisma } from '../../server';

export const coverageController = {
  checkCoverage: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, employeeId } = req.body;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const days: Date[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
      
      const shifts = await prisma.shifts.findMany();
      const configs = await prisma.pharmacy_configs.findMany();
      
      const coverageResults = [];
      const warnings = [];
      
      for (const day of days) {
        const dateStr = day.toISOString().split('T')[0];
        
        for (const shift of shifts) {
          const assignments = await prisma.shift_assignments.findMany({
            where: {
              shift_id: shift.id,
              date: day
            }
          });
          
          const approvedRequests = await prisma.time_off_requests.findMany({
            where: {
              status: 'approved',
              start_date: { lte: day },
              end_date: { gte: day }
            }
          });
          
          const assignedIds = assignments.map(a => a.employee_id);
          const vacationIds = approvedRequests.map(r => r.employee_id);
          const availableIds = assignedIds.filter(id => !vacationIds.includes(id));
          
          let minRequired = shift.min_employees_required;
          const override = await prisma.pharmacy_config_overrides.findFirst({
            where: {
              shift_id: shift.id,
              date: day
            }
          });
          if (override) {
            minRequired = override.min_employees_required;
          } else {
            const config = configs.find(c => c.shift_id === shift.id);
            if (config) minRequired = config.min_employees_required;
          }
          
          const currentCount = availableIds.length;
          const isCritical = currentCount < minRequired;
          
          // Obtener nombres de empleados para mostrar
          const employeesWithNames = await Promise.all(availableIds.map(async (id) => {
            const emp = await prisma.employees.findUnique({
              where: { id }
            });
            let name = null;
            if (emp) {
              const user = await prisma.users.findUnique({
                where: { id: emp.user_id },
                select: { full_name: true }
              });
              name = user?.full_name;
            }
            return { id: emp?.id, name };
          }));
          
          coverageResults.push({
            date: dateStr,
            shiftId: shift.id,
            shiftName: shift.name,
            currentCount,
            requiredMin: minRequired,
            isCritical,
            employees: employeesWithNames
          });
          
          if (isCritical && (!employeeId || (employeeId && !vacationIds.includes(parseInt(employeeId))))) {
            warnings.push({
              date: dateStr,
              shift: shift.name,
              current: currentCount,
              required: minRequired,
              message: `${shift.name} on ${dateStr}: ${currentCount}/${minRequired} employees (minimum not met)`
            });
          }
        }
      }
      
      res.json({
        success: true,
        data: {
          coverage: coverageResults,
          warnings,
          hasWarnings: warnings.length > 0
        }
      });
    } catch (error: any) {
      console.error('Error checking coverage:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getCoverage: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const shifts = await prisma.shifts.findMany();
      const configs = await prisma.pharmacy_configs.findMany();
      
      const coverageData = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = new Date(d);
        const dateStr = day.toISOString().split('T')[0];
        
        for (const shift of shifts) {
          const assignments = await prisma.shift_assignments.findMany({
            where: {
              shift_id: shift.id,
              date: day
            }
          });
          
          const approvedRequests = await prisma.time_off_requests.findMany({
            where: {
              status: 'approved',
              start_date: { lte: day },
              end_date: { gte: day }
            }
          });
          
          const assignedIds = assignments.map(a => a.employee_id);
          const vacationIds = approvedRequests.map(r => r.employee_id);
          const availableIds = assignedIds.filter(id => !vacationIds.includes(id));
          
          let minRequired = shift.min_employees_required;
          const override = await prisma.pharmacy_config_overrides.findFirst({
            where: {
              shift_id: shift.id,
              date: day
            }
          });
          if (override) {
            minRequired = override.min_employees_required;
          } else {
            const config = configs.find(c => c.shift_id === shift.id);
            if (config) minRequired = config.min_employees_required;
          }
          
          // Obtener nombres de empleados
          const employeesWithNames = await Promise.all(availableIds.map(async (id) => {
            const emp = await prisma.employees.findUnique({
              where: { id }
            });
            let name = null;
            if (emp) {
              const user = await prisma.users.findUnique({
                where: { id: emp.user_id },
                select: { full_name: true }
              });
              name = user?.full_name;
            }
            return { id: emp?.id, name };
          }));
          
          coverageData.push({
            date: dateStr,
            shiftId: shift.id,
            shiftName: shift.name,
            currentCount: availableIds.length,
            requiredMin: minRequired,
            employees: employeesWithNames
          });
        }
      }
      
      res.json({ success: true, data: coverageData });
    } catch (error: any) {
      console.error('Error getting coverage:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

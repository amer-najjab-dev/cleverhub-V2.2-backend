import { prisma } from '../server';

// Normaliza una fecha a mediodía UTC (12:00:00.000Z)
const normalizeToUTC = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  // 12:00 UTC garantiza que ningún offset mueva la fecha a otro día
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};

// Convierte Date UTC a YYYY-MM-DD
const toUTCString = (date: Date): string => {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, 
'0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

export const shiftAssignmentService = {
  assignRange: async (employeeId: number, shiftId: number, startDateStr: string, endDateStr: string) => {
    const start = normalizeToUTC(startDateStr);
    const end = normalizeToUTC(endDateStr);
    
    const dates: Date[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Eliminar asignaciones existentes en el rango
      await tx.shift_assignments.deleteMany({
        where: {
          employee_id: employeeId,
          date: {
            gte: start,
            lte: end
          }
        }
      });

      // 2. Crear nuevas asignaciones
      const assignments = [];
      for (const date of dates) {
        const assignment = await tx.shift_assignments.create({
          data: {
            employee_id: employeeId,
            shift_id: shiftId,
            date: date
          }
        });
        assignments.push(assignment);
      }

      return assignments;
    });
  },

  getByDateRange: async (pharmacyId: number, startDateStr: string, endDateStr: string) => {
    const start = normalizeToUTC(startDateStr);
    const end = normalizeToUTC(endDateStr);

    const assignments = await prisma.shift_assignments.findMany({
      where: {
        employees: { pharmacy_id: pharmacyId },
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        shifts: true,
        employees: {
          include: { users: true }
        }
      }
    });

    // Devolver fechas en formato YYYY-MM-DD UTC
    return assignments.map(a => ({
      ...a,
      date: toUTCString(a.date)
    }));
  }
};

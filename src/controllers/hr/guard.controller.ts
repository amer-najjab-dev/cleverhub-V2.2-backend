import { Request, Response } from 'express';
import { prisma } from '../../server';

export const guardController = {
  getSchedules: async (req: Request, res: Response) => {
    try {
      const schedules = await prisma.guard_schedules.findMany({
        orderBy: [{ year: 'desc' }, { week_number: 'asc' }]
      });
      res.json({ success: true, data: schedules });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateSchedule: async (req: Request, res: Response) => {
    try {
      const { shiftId, weeks } = req.body;
      const year = new Date().getFullYear();

      // Eliminar semanas existentes
      await prisma.guard_schedules.deleteMany({
        where: { shift_id: shiftId, year }
      });

      // Insertar nuevas semanas
      if (weeks && weeks.length > 0) {
        await prisma.guard_schedules.createMany({
          data: weeks.map((week: number) => ({
            shift_id: shiftId,
            week_number: week,
            year
          }))
        });
      }

      res.json({ success: true, message: 'Guardias actualizadas' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

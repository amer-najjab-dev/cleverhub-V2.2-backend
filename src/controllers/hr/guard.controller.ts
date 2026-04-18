import { Request, Response } from 'express';
import { prisma } from '../../server';

export const guardController = {
  // Obtener todos los periodos de guardia
  getPeriods: async (req: Request, res: Response) => {
    try {
      const periods = await prisma.guard_schedules.findMany({
        include: {
          shifts: true
        },
        orderBy: { start_date: 'asc' }
      });
      
      // Formatear respuesta
      const formatted = periods.map(p => ({
        id: p.id,
        shift_id: p.shift_id,
        shift_name: p.shifts?.name,
        start_date: p.start_date,
        end_date: p.end_date,
        created_at: p.created_at,
        updated_at: p.updated_at
      }));
      
      res.json({ success: true, data: formatted });
    } catch (error: any) {
      console.error('Error getting guard periods:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Crear nuevo periodo de guardia
  createPeriod: async (req: Request, res: Response) => {
    try {
      const { shiftId, startDate, endDate } = req.body;
      
      const period = await prisma.guard_schedules.create({
        data: {
          shift_id: shiftId,
          start_date: new Date(startDate),
          end_date: new Date(endDate)
        }
      });
      
      res.status(201).json({ success: true, data: period });
    } catch (error: any) {
      console.error('Error creating guard period:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Eliminar periodo de guardia
  deletePeriod: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await prisma.guard_schedules.delete({
        where: { id: parseInt(id) }
      });
      
      res.json({ success: true, message: 'Guard period deleted' });
    } catch (error: any) {
      console.error('Error deleting guard period:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
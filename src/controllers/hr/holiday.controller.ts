import { Request, Response } from 'express';
import { prisma } from '../../server';

export const holidayController = {
  // Obtener todos los festivos
  getAll: async (req: Request, res: Response) => {
    try {
      const holidays = await prisma.holidays.findMany({
        orderBy: { date: 'asc' }
      });
      res.json({ success: true, data: holidays });
    } catch (error: any) {
      console.error('Error getting holidays:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Crear nuevo festivo
  create: async (req: Request, res: Response) => {
    try {
      const { name, date, isRecurring } = req.body;
      
      const holiday = await prisma.holidays.create({
        data: {
          name,
          date: new Date(date),
          is_recurring: isRecurring || false
        }
      });
      
      res.status(201).json({ success: true, data: holiday });
    } catch (error: any) {
      console.error('Error creating holiday:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Eliminar festivo
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await prisma.holidays.delete({
        where: { id: parseInt(id) }
      });
      
      res.json({ success: true, message: 'Holiday deleted' });
    } catch (error: any) {
      console.error('Error deleting holiday:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

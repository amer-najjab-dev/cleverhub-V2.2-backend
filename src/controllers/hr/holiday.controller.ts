import { Request, Response } from 'express';
import { prisma } from '../../server';

// Extender Request para incluir user
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    pharmacyId: number | null;
  };
}

export const holidayController = {
  // Obtener todos los festivos de la farmacia
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }
      
      const holidays = await prisma.holidays.findMany({
        where: { pharmacy_id: pharmacyId },
        orderBy: { date: 'asc' }
      });
      res.json({ success: true, data: holidays });
    } catch (error: any) {
      console.error('Error getting holidays:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Crear nuevo festivo
  create: async (req: AuthRequest, res: Response) => {
    try {
      const { name, date, isRecurring } = req.body;
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }
      
      const holiday = await prisma.holidays.create({
        data: {
          name,
          date: new Date(date),
          is_recurring: isRecurring || false,
          pharmacy_id: pharmacyId
        }
      });
      
      res.status(201).json({ success: true, data: holiday });
    } catch (error: any) {
      console.error('Error creating holiday:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Eliminar festivo
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }
      
      await prisma.holidays.delete({
        where: { 
          id: parseInt(id),
          pharmacy_id: pharmacyId 
        }
      });
      
      res.json({ success: true, message: 'Holiday deleted' });
    } catch (error: any) {
      console.error('Error deleting holiday:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

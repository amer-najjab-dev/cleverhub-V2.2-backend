import { Request, Response } from 'express';
import { prisma } from '../../server';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    pharmacyId: number | null;
  };
}

// ✅ FUNCIÓN FUERA DEL OBJETO (antes de export const shiftController)
const getShiftColor = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('mañana') || lowerName.includes('matin')) {
    return '#87CEEB'; // Celeste
  }
  if (lowerName.includes('tarde') || lowerName.includes('après-midi')) {
    return '#FFA500'; // Naranja
  }
  if (lowerName.includes('noche') || lowerName.includes('nuit')) {
    return '#483D8B'; // Color luna
  }
  return '#3B82F6'; // Azul por defecto
};

export const shiftController = {
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }
      
      const shifts = await prisma.shifts.findMany({
        where: { pharmacy_id: pharmacyId },
        include: {
          pharmacy_configs: true
        },
        orderBy: { start_time: 'asc' }
      });
      
      const formattedShifts = shifts.map(shift => ({
        id: shift.id,
        name: shift.name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        is_guard: shift.is_guard,
        min_employees_required: shift.min_employees_required,
        color: shift.color,  // ← Añadir color a la respuesta
        created_at: shift.created_at,
        updated_at: shift.updated_at
      }));
      
      res.json({ success: true, data: formattedShifts });
    } catch (error: any) {
      console.error('Error getting shifts:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  create: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyId = req.user?.pharmacyId;
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
      }

      const { name, start_time, end_time, min_employees_required, color } = req.body;

      // Validar campos requeridos
      if (!name || !start_time || !end_time) {
        return res.status(400).json({ 
          success: false, 
          message: 'Faltan campos requeridos: name, start_time, end_time' 
        });
      }

      const shift = await prisma.shifts.create({
        data: {
          pharmacy_id: pharmacyId,
          name,
          start_time,
          end_time,
          min_employees_required: min_employees_required || 1,
          color: color || getShiftColor(name),
          is_guard: false,
          updated_at: new Date()
        }
      });

      // Crear configuración por defecto en pharmacy_configs
      await prisma.pharmacy_configs.create({
        data: {
          shift_id: shift.id,
          min_employees_required: min_employees_required || 1
        }
      });

      res.status(201).json({ success: true, data: shift });
    } catch (error: any) {
      console.error('Error creating shift:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  update: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, start_time, end_time, is_guard, min_employees_required, color } = req.body;
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }
      
      const shift = await prisma.shifts.update({
        where: { id: parseInt(id), pharmacy_id: pharmacyId },
        data: {
          name,
          start_time,
          end_time,
          is_guard: is_guard || false,
          min_employees_required,
          color: color || getShiftColor(name),
          updated_at: new Date()
        }
      });
      
      if (min_employees_required !== undefined) {
        await prisma.pharmacy_configs.upsert({
          where: { shift_id: parseInt(id) },
          update: { min_employees_required },
          create: {
            shift_id: parseInt(id),
            min_employees_required
          }
        });
      }
      
      res.json({ success: true, data: shift });
    } catch (error: any) {
      console.error('Error updating shift:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }
      
      // 1. Desasignar empleados que tienen este turno por defecto
      await prisma.employees.updateMany({
        where: { default_shift_id: parseInt(id), pharmacy_id: pharmacyId },
        data: { default_shift_id: null }
      });
      
      // 2. Eliminar asignaciones futuras de este turno
      await prisma.shift_assignments.deleteMany({
        where: { shift_id: parseInt(id) }
      });
      
      // 3. Eliminar el turno
      await prisma.shifts.delete({
        where: { id: parseInt(id), pharmacy_id: pharmacyId }
      });
      
      res.json({ success: true, message: 'Turno eliminado correctamente' });
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getConfig: async (req: AuthRequest, res: Response) => {
    try {
      const { shiftId } = req.params;
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }
      
      const config = await prisma.pharmacy_configs.upsert({
        where: { shift_id: parseInt(shiftId) },
        update: {},
        create: {
          shift_id: parseInt(shiftId),
          min_employees_required: 1
        }
      });
      
      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('Error getting shift config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateShiftConfig: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { min_employees_required } = req.body;
      const pharmacyId = req.user?.pharmacyId;

      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }

      if (min_employees_required < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'El número mínimo de empleados debe ser al menos 1' 
        });
      }

      const shift = await prisma.shifts.findFirst({
        where: { 
          id: parseInt(id), 
          pharmacy_id: pharmacyId 
        }
      });

      if (!shift) {
        return res.status(404).json({ 
          success: false, 
          message: 'Turno no encontrado' 
        });
      }

      await prisma.pharmacy_configs.upsert({
        where: { shift_id: parseInt(id) },
        update: { min_employees_required },
        create: {
          shift_id: parseInt(id),
          min_employees_required
        }
      });

      await prisma.shifts.update({
        where: { id: parseInt(id), pharmacy_id: pharmacyId },
        data: { min_employees_required }
      });

      res.json({ 
        success: true, 
        message: 'Configuración actualizada correctamente',
        data: { min_employees_required }
      });
    } catch (error: any) {
      console.error('Error updating shift config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
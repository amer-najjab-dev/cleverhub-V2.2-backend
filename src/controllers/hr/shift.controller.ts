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
      const { name, startTime, endTime, isGuard, minEmployeesRequired } = req.body;
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }
      
      const shift = await prisma.shifts.create({
        data: {
          name,
          start_time: startTime,
          end_time: endTime,
          is_guard: isGuard || false,
          min_employees_required: minEmployeesRequired || 1,
          pharmacy_id: pharmacyId,
          updated_at: new Date()
        }
      });
      
      await prisma.pharmacy_configs.create({
        data: {
          shift_id: shift.id,
          min_employees_required: minEmployeesRequired || 1
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
      const { name, startTime, endTime, isGuard, minEmployeesRequired } = req.body;
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }
      
      const shift = await prisma.shifts.update({
        where: { id: parseInt(id), pharmacy_id: pharmacyId },
        data: {
          name,
          start_time: startTime,
          end_time: endTime,
          is_guard: isGuard,
          min_employees_required: minEmployeesRequired
        }
      });
      
      await prisma.pharmacy_configs.update({
        where: { shift_id: parseInt(id) },
        data: { min_employees_required: minEmployeesRequired }
      });
      
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
      
      const employeesWithShift = await prisma.employees.count({
        where: { default_shift_id: parseInt(id), pharmacy_id: pharmacyId }
      });
      
      if (employeesWithShift > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se puede eliminar el turno porque hay empleados asignados' 
        });
      }
      
      await prisma.shifts.delete({
        where: { id: parseInt(id), pharmacy_id: pharmacyId }
      });
      
      res.json({ success: true, message: 'Shift deleted' });
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

  /**
   * Actualizar la configuración mínima de empleados para un turno
   * @route PATCH /api/hr/shifts/:id/config
   * @param id - ID del turno
   * @param min_employees_required - Número mínimo de empleados requeridos
   */
  updateShiftConfig: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { min_employees_required } = req.body;
      const pharmacyId = req.user?.pharmacyId;

      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }

      // Validar que el valor sea positivo
      if (min_employees_required < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'El número mínimo de empleados debe ser al menos 1' 
        });
      }

      // Verificar que el turno existe y pertenece a la farmacia
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

      // Actualizar en pharmacy_configs (configuración específica)
      await prisma.pharmacy_configs.upsert({
        where: { shift_id: parseInt(id) },
        update: { min_employees_required: min_employees_required },
        create: {
          shift_id: parseInt(id),
          min_employees_required: min_employees_required
        }
      });

      // También actualizar en shifts (por compatibilidad)
      await prisma.shifts.update({
        where: { id: parseInt(id), pharmacy_id: pharmacyId },
        data: { min_employees_required: min_employees_required }
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
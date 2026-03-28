import { Request, Response } from 'express';
import { prisma } from '../../server';

export const shiftController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const shifts = await prisma.shifts.findMany({
        orderBy: { id: 'asc' }
      });
      res.json({ success: true, data: shifts });
    } catch (error: any) {
      console.error('Error getting shifts:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  create: async (req: Request, res: Response) => {
    try {
      const { name, startTime, endTime, isGuard, minEmployeesRequired } = req.body;
      
      const shift = await prisma.shifts.create({
        data: {
          name,
          start_time: startTime,
          end_time: endTime,
          is_guard: isGuard || false,
          min_employees_required: minEmployeesRequired || 1
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
  
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, startTime, endTime, isGuard, minEmployeesRequired } = req.body;
      
      const shift = await prisma.shifts.update({
        where: { id: parseInt(id) },
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
  
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const employeesWithShift = await prisma.employees.count({
        where: { default_shift_id: parseInt(id) }
      });
      
      if (employeesWithShift > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete shift because employees are assigned to it'
        });
      }
      
      await prisma.shifts.delete({
        where: { id: parseInt(id) }
      });
      
      res.json({ success: true, message: 'Shift deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

    async updateConfig(req: Request, res: Response) {
    try {
      const { shiftId, minEmployeesRequired } = req.body;
      
      const config = await prisma.pharmacy_configs.upsert({
        where: { shift_id: shiftId },
        update: { min_employees_required: minEmployeesRequired },
        create: {
          shift_id: shiftId,
          min_employees_required: minEmployeesRequired
        }
      });
      
      // También actualizar el turno directamente
      await prisma.shifts.update({
        where: { id: shiftId },
        data: { min_employees_required: minEmployeesRequired }
      });
      
      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('Error updating shift config:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

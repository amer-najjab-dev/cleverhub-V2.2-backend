import { Request, Response } from 'express';
import { prisma } from '../../server';
import bcrypt from 'bcrypt';

export const employeeController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const employees = await prisma.employees.findMany({
        include: {
          default_shift: true,
          shift_assignments: {
            take: 30,
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { id: 'desc' }
      });
      
      // Obtener datos del usuario por separado
      const employeesWithUsers = await Promise.all(employees.map(async (emp) => {
        const user = await prisma.users.findUnique({
          where: { id: emp.user_id },
          select: { id: true, email: true, full_name: true, role: true, is_active: true }
        });
        return { ...emp, user };
      }));
      
      res.json({ success: true, data: employeesWithUsers });
    } catch (error: any) {
      console.error('Error getting employees:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const employee = await prisma.employees.findUnique({
        where: { id: parseInt(id) },
        include: {
          default_shift: true,
          shift_assignments: {
            take: 30,
            orderBy: { date: 'desc' }
          },
          time_off_requests: {
            where: { status: { not: 'rejected' } },
            orderBy: { created_at: 'desc' },
            take: 10
          }
        }
      });
      
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      
      const user = await prisma.users.findUnique({
        where: { id: employee.user_id },
        select: { id: true, email: true, full_name: true, role: true, is_active: true }
      });
      
      res.json({ success: true, data: { ...employee, user } });
    } catch (error: any) {
      console.error('Error getting employee:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  create: async (req: Request, res: Response) => {
    try {
      const { email, fullName, phone, dni, password, defaultShiftId, vacationDays } = req.body;
      
      const existingUser = await prisma.users.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      
      const hashedPassword = await bcrypt.hash(password || 'empleado123', 10);
      const user = await prisma.users.create({
        data: {
          email,
          full_name: fullName,
          password: hashedPassword,
          role: 'employee',
          is_active: true
        }
      });
      
      const employee = await prisma.employees.create({
        data: {
          user_id: user.id,
          default_shift_id: defaultShiftId || null,
          vacation_days: vacationDays || 25,
          vacation_days_used: 0
        }
      });
      
      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: { ...employee, user }
      });
    } catch (error: any) {
      console.error('Error creating employee:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { defaultShiftId, vacationDays, vacationDaysUsed, isActive } = req.body;
      
      const employee = await prisma.employees.update({
        where: { id: parseInt(id) },
        data: {
          default_shift_id: defaultShiftId,
          vacation_days: vacationDays,
          vacation_days_used: vacationDaysUsed
        }
      });
      
      if (isActive !== undefined) {
        await prisma.users.update({
          where: { id: employee.user_id },
          data: { is_active: isActive }
        });
      }
      
      const user = await prisma.users.findUnique({
        where: { id: employee.user_id },
        select: { id: true, email: true, full_name: true, role: true, is_active: true }
      });
      
      res.json({
        success: true,
        message: 'Employee updated successfully',
        data: { ...employee, user }
      });
    } catch (error: any) {
      console.error('Error updating employee:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const employee = await prisma.employees.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      
      await prisma.users.update({
        where: { id: employee.user_id },
        data: { is_active: false }
      });
      
      res.json({
        success: true,
        message: 'Employee deactivated successfully'
      });
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getAssignments: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, employeeId } = req.query;
      
      const where: any = {};
      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }
      if (employeeId) {
        where.employee_id = parseInt(employeeId as string);
      }
      
      const assignments = await prisma.shift_assignments.findMany({
        where,
        include: {
          shift: true
        },
        orderBy: { date: 'asc' }
      });
      
      // Obtener empleados con sus usuarios
      const assignmentsWithEmployees = await Promise.all(assignments.map(async (a) => {
        const employee = await prisma.employees.findUnique({
          where: { id: a.employee_id }
        });
        let employeeWithName = null;
        if (employee) {
          const user = await prisma.users.findUnique({
            where: { id: employee.user_id },
            select: { full_name: true }
          });
          employeeWithName = { ...employee, user: { full_name: user?.full_name } };
        }
        return { ...a, employee: employeeWithName };
      }));
      
      res.json({ success: true, data: assignmentsWithEmployees });
    } catch (error: any) {
      console.error('Error getting assignments:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  assignShift: async (req: Request, res: Response) => {
    try {
      const { employeeId, shiftId, date } = req.body;
      
      if (!employeeId || !shiftId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      
      const data: any = {
        employee_id: employeeId,
        shift_id: shiftId
      };
      
      if (date) {
        data.date = new Date(date);
        
        const existing = await prisma.shift_assignments.findFirst({
          where: {
            employee_id: employeeId,
            date: new Date(date)
          }
        });
        
        if (existing) {
          const assignment = await prisma.shift_assignments.update({
            where: { id: existing.id },
            data: { shift_id: shiftId }
          });
          return res.json({ success: true, data: assignment });
        }
      } else {
        const employee = await prisma.employees.update({
          where: { id: employeeId },
          data: { default_shift_id: shiftId }
        });
        return res.json({ success: true, data: employee });
      }
      
      const assignment = await prisma.shift_assignments.create({ data });
      res.status(201).json({ success: true, data: assignment });
    } catch (error: any) {
      console.error('Error assigning shift:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // ✅ NUEVO MÉTODO: Eliminar asignación de turno específica
  removeShiftAssignment: async (req: Request, res: Response) => {
    try {
      const { employeeId, shiftId, date } = req.body;
      
      // Validar campos requeridos
      if (!employeeId || !shiftId || !date) {
        return res.status(400).json({ 
          success: false, 
          message: 'Faltan campos requeridos: employeeId, shiftId, date' 
        });
      }
      
      // Buscar la asignación específica
      const assignment = await prisma.shift_assignments.findFirst({
        where: {
          employee_id: employeeId,
          shift_id: shiftId,
          date: new Date(date)
        }
      });
      
      if (!assignment) {
        return res.status(404).json({ 
          success: false, 
          message: 'Asignación no encontrada para el empleado, turno y fecha especificados' 
        });
      }
      
      // Eliminar la asignación
      await prisma.shift_assignments.delete({
        where: { id: assignment.id }
      });
      
      res.json({ 
        success: true, 
        message: 'Empleado eliminado del turno correctamente' 
      });
    } catch (error: any) {
      console.error('Error removing shift assignment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
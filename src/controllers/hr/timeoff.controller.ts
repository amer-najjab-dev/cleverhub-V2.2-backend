import { Request, Response } from 'express';
import { prisma } from '../../server';

export const timeOffController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const { status, employeeId, startDate, endDate } = req.query;
      
      const where: any = {};
      if (status) where.status = status;
      if (employeeId) where.employees_id = parseInt(employeeId as string);
      if (startDate && endDate) {
        where.start_date = { gte: new Date(startDate as string) };
        where.end_date = { lte: new Date(endDate as string) };
      }
      
      const requests = await prisma.time_off_requests.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });
      
      // Obtener datos de empleados y revisores
      const requestsWithDetails = await Promise.all(requests.map(async (req) => {
        const employee = await prisma.employees.findUnique({
          where: { id: req.employee_id }
        });
        let employeeName = null;
        let employeeEmail = null;
        if (employee) {
          const user = await prisma.users.findUnique({
            where: { id: employee.user_id },
            select: { full_name: true, email: true }
          });
          employeeName = user?.full_name;
          employeeEmail = user?.email;
        }
        
        let reviewer = null;
        if (req.reviewed_by) {
          reviewer = await prisma.users.findUnique({
            where: { id: req.reviewed_by },
            select: { full_name: true }
          });
        }
        
        return {
          ...req,
          employeeName,
          employeeEmail,
          reviewerName: reviewer?.full_name
        };
      }));
      
      res.json({ success: true, data: requestsWithDetails });
    } catch (error: any) {
      console.error('Error getting time off requests:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  create: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, notes, coverageWarning, coverageDetails } = req.body;
      const userId = (req as any).user?.id;
      
      const employee = await prisma.employees.findUnique({
        where: { user_id: userId }
      });
      
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysRequested = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      
      const availableDays = employee.vacation_days - employee.vacation_days_used;
      if (daysRequested > availableDays) {
        return res.status(400).json({
          success: false,
          message: `Not enough vacation days. Available: ${availableDays}, Requested: ${daysRequested}`
        });
      }
      
      const request = await prisma.time_off_requests.create({
        data: {
          employee_id: employee.id,
          start_date: new Date(startDate),
          end_date: new Date(endDate),
          notes,
          coverage_warning: coverageWarning || false,
          coverage_details: coverageDetails || null
        }
      });
      
      res.status(201).json({ success: true, data: request });
    } catch (error: any) {
      console.error('Error creating time off request:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  approve: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      const request = await prisma.time_off_requests.findUnique({
        where: { id: parseInt(id) },
        include: { employees: true }
      });
      
      if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      
      if (request.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Request already processed' });
      }
      
      const start = new Date(request.start_date);
      const end = new Date(request.end_date);
      const daysRequested = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      
      await prisma.employees.update({
        where: { id: request.employee_id },
        data: {
          vacation_days_used: request.employees.vacation_days_used + daysRequested
        }
      });
      
      const updated = await prisma.time_off_requests.update({
        where: { id: parseInt(id) },
        data: {
          status: 'approved',
          reviewed_by: userId,
          reviewed_at: new Date()
        }
      });
      
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('Error approving request:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  reject: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      const request = await prisma.time_off_requests.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      
      const updated = await prisma.time_off_requests.update({
        where: { id: parseInt(id) },
        data: {
          status: 'rejected',
          reviewed_by: userId,
          reviewed_at: new Date()
        }
      });
      
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getBalance: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      
      const employee = await prisma.employees.findUnique({
        where: { user_id: userId }
      });
      
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      
      res.json({
        success: true,
        data: {
          totalDays: employee.vacation_days,
          usedDays: employee.vacation_days_used,
          remainingDays: employee.vacation_days - employee.vacation_days_used
        }
      });
    } catch (error: any) {
      console.error('Error getting vacation balance:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/rbac';

export const stockController = {
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyFilter = (req as any).pharmacyFilter || {};
      
      const stock = await prisma.inventory_lots.findMany({
        where: pharmacyFilter,
        include: {
          product: true
        },
        orderBy: { expiry_date: 'asc' }
      });
      
      res.json({ success: true, data: stock });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getLowStock: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyFilter = (req as any).pharmacyFilter || {};
      
      const lowStock = await prisma.inventory_lots.findMany({
        where: {
          ...pharmacyFilter,
          quantity: { lt: 10 }
        },
        include: { product: true }
      });
      
      res.json({ success: true, data: lowStock });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getExpiringProducts: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyFilter = (req as any).pharmacyFilter || {};
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiring = await prisma.inventory_lots.findMany({
        where: {
          ...pharmacyFilter,
          expiry_date: { lte: thirtyDaysFromNow }
        },
        include: { product: true },
        orderBy: { expiry_date: 'asc' }
      });
      
      res.json({ success: true, data: expiring });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  createMovement: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyFilter = (req as any).pharmacyFilter || {};
      const { product_id, type, quantity, notes } = req.body;
      const pharmacyId = pharmacyFilter.pharmacy_id;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
      }
      
      const movement = await prisma.stock_movements.create({
        data: {
          product_id,
          pharmacy_id: pharmacyId,
          type,
          quantity,
          stock_after: 0, // TODO: calcular
          notes,
          user_id: req.user?.id
        }
      });
      
      res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getMovements: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyFilter = (req as any).pharmacyFilter || {};
      
      const movements = await prisma.stock_movements.findMany({
        where: pharmacyFilter,
        include: {
          product: true,
          user: true
        },
        orderBy: { created_at: 'desc' },
        take: 100
      });
      
      res.json({ success: true, data: movements });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  adjustStock: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const pharmacyFilter = (req as any).pharmacyFilter || {};
      
      const lot = await prisma.inventory_lots.update({
        where: {
          id: parseInt(id),
          ...pharmacyFilter
        },
        data: { quantity }
      });
      
      res.json({ success: true, data: lot });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getByProduct: async (req: AuthRequest, res: Response) => {
    try {
      const { productId } = req.params;
      const pharmacyFilter = (req as any).pharmacyFilter || {};
      
      const stock = await prisma.inventory_lots.findMany({
        where: {
          ...pharmacyFilter,
          product_id: parseInt(productId)
        },
        include: { product: true }
      });
      
      res.json({ success: true, data: stock });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

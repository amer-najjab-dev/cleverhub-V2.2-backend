// src/controllers/product.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../server';

export class ProductController {
  
  async listar(req: Request, res: Response) {
    try {
      const { q, category, page = 1, limit = 20 } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { active: true };

      if (q) {
        where.OR = [
          { name: { contains: q as string, mode: 'insensitive' } },
          { barcode: { contains: q as string, mode: 'insensitive' } }
        ];
      }
      if (category) {
        where.category = category as string;
      }

      const [products, total] = await Promise.all([
        prisma.products.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { name: 'asc' }
        }),
        prisma.products.count({ where })
      ]);

      res.json({
        success: true,
        data: products,
        meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.products.findUnique({
        where: { id: parseInt(id) }
      });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }

      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async buscar(req: Request, res: Response) {
    try {
      const { q } = req.query;
      if (!q) return res.json({ success: true, data: [] });

      const products = await prisma.products.findMany({
        where: {
          name: { contains: q as string, mode: 'insensitive' },
          active: true
        },
        take: 20,
        orderBy: { name: 'asc' }
      });

      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPriceHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const history = await prisma.price_history.findMany({
        where: { product_id: parseInt(id) },
        orderBy: { date: 'desc' },
        take: 10
      });
      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const productController = new ProductController();
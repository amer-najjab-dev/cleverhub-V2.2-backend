import { Request, Response } from 'express';
import { prisma } from '../server';
import { CreateSaleDTO } from '../dtos/sale.dto';

export class VentaController {
  async crear(req: Request, res: Response) {
    console.log('Payload recibido:', JSON.stringify(req.body, null, 2));
    try {
      const { userId, clientId, paymentMethod, items } = req.body;
      
      if (!userId || !items) {
        return res.status(400).json({ error: 'Faltan datos: userId, items' });
      }

      // Calcular total
      const subtotal = items.reduce((sum: number, item: any) => 
        sum + (item.price * item.quantity), 0);
      
      const total = subtotal; // Por ahora sin impuestos

      // Crear venta con Prisma
      const venta = await prisma.sales.create({
        data: {
          sale_number: `V-${Date.now()}`,
          user_id: userId,
          client_id: clientId,
          subtotal,
          total,
          paid_amount: total,
          payment_method: paymentMethod,
          payment_status: 'paid',
          sale_status: 'completed',
          items: {
            create: items.map((item: any) => ({
              product_id: item.productId,
              quantity: item.quantity,
              unit_price_ppv: item.price,
              unit_price_pph: 0, // Habría que calcularlo
              subtotal: item.price * item.quantity,
              total: item.price * item.quantity,
              margin: 0
            }))
          }
        },
        include: {
          items: true,
          client: true,
          user: true
        }
      });

      res.status(201).json({
        success: true,
        data: venta
      });
      
    } catch (error: any) {
      console.error('Error detallado:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      const venta = await prisma.sales.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true
            }
          },
          client: true,
          user: true
        }
      });
      
      if (!venta) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }
      
      res.json({
        success: true,
        data: venta
      });
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async listar(req: Request, res: Response) {
    try {
      const {
        startDate,
        endDate,
        clientId,
        userId,
        saleStatus,
        paymentStatus,
        paymentMethod,
        limit = 50,
        offset = 0
      } = req.query;

      const where: any = {};

      if (startDate && endDate) {
        where.created_at = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      if (clientId) where.client_id = parseInt(clientId as string);
      if (userId) where.user_id = parseInt(userId as string);
      if (saleStatus) where.sale_status = saleStatus as string;
      if (paymentStatus) where.payment_status = paymentStatus as string;
      if (paymentMethod) where.payment_method = paymentMethod as string;

      const ventas = await prisma.sales.findMany({
        where,
        include: {
          client: true,
          user: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: Number(limit),
        skip: Number(offset)
      });

      const total = await prisma.sales.count({ where });

      res.json({
        success: true,
        data: ventas,
        meta: {
          total,
          limit: Number(limit),
          offset: Number(offset)
        }
      });
      
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

export const saleController = new VentaController();
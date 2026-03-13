import { Request, Response } from 'express';
import { prisma } from '../server';
import { CreateSaleDTO } from '../dtos/sale.dto';

export class VentaController {
  async crear(req: Request, res: Response) {
    console.log('Payload recibido:', JSON.stringify(req.body, null, 2));
    try {
      const { userId, clientId, paymentMethod, items, subtotal, total, paidAmount } = req.body;
      
      if (!userId || !items || !items.length) {
        return res.status(400).json({ error: 'Faltan datos: userId, items' });
      }

      // Calcular total si no viene, o usar el que viene
      let calculatedSubtotal = subtotal || 0;
      let calculatedTotal = total || 0;
      
      // Si no vienen calculados, calcularlos
      if (!calculatedSubtotal) {
        calculatedSubtotal = items.reduce((sum: number, item: any) => {
          // Intentar con diferentes nombres de campo
          const price = item.price || item.unit_price_ppv || item.unitPricePPV || 0;
          return sum + (price * item.quantity);
        }, 0);
      }
      
      if (!calculatedTotal) {
        calculatedTotal = calculatedSubtotal; // Sin impuestos por ahora
      }

      // Crear venta con Prisma
      const venta = await prisma.sales.create({
        data: {
          sale_number: `V-${Date.now()}`,
          user_id: userId,
          client_id: clientId,
          subtotal: calculatedSubtotal,
          total: calculatedTotal,
          paid_amount: paidAmount || calculatedTotal,
          payment_method: paymentMethod || 'cash',
          payment_status: 'paid',
          sale_status: 'completed',
          sale_items: {
            create: items.map((item: any) => {
              // Obtener precio del item (manejar diferentes nombres)
              const pricePPV = item.price || item.unit_price_ppv || item.unitPricePPV || 0;
              const pricePPH = item.unit_price_pph || item.unitPricePPH || 0;
              
              return {
                product_id: item.productId,
                quantity: item.quantity,
                unit_price_ppv: pricePPV,
                unit_price_pph: pricePPH,
                subtotal: pricePPV * item.quantity,
                total: pricePPV * item.quantity,
                margin: (pricePPV - pricePPH) * item.quantity
              };
            })
          }
        },
        include: {
          sale_items: true,
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
          sale_items: {
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
          sale_items: {
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
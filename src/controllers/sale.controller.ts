import { Request, Response } from 'express';
import { prisma } from '../server';
import { CreateSaleDTO } from '../dtos/sale.dto';

export class VentaController {
  async crear(req: Request, res: Response) {
    console.log('Payload recibido:', JSON.stringify(req.body, null, 2));
    try {
      const { userId, clientId, paymentMethod, items, payments: paymentItems, notes } = req.body;
      
      if (!userId || !items || !items.length) {
        return res.status(400).json({ error: 'Faltan datos: userId, items' });
      }

      // Calcular subtotal basado en los items
      let calculatedSubtotal = 0;
      const itemsWithPrices = [];

      for (const item of items) {
        // Obtener precios del item (pueden venir del frontend o de la BD)
        const pricePPV = Number(item.unit_price_ppv || item.price || 0);
        const pricePPH = Number(item.unit_price_pph || 0);
        const itemTotal = pricePPV * item.quantity;
        calculatedSubtotal += itemTotal;

        itemsWithPrices.push({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price_ppv: pricePPV,
          unit_price_pph: pricePPH,
          subtotal: itemTotal,
          total: itemTotal,
          margin: (pricePPV - pricePPH) * item.quantity
        });
      }

      const calculatedTotal = calculatedSubtotal;

      // Procesar pagos
      // Procesar pagos
      let totalPaid = 0;
      let hasCredit = false;
      let paymentsToCreate = [];

      if (paymentItems && Array.isArray(paymentItems) && paymentItems.length > 0) {
        // Usar el array de pagos del body
        for (const payment of paymentItems) {
          const amount = Number(payment.amount) || 0;
          const method = payment.method || 'cash';
          
          // Solo sumar a totalPaid si NO es crédito
          if (method.toLowerCase() !== 'credit' && method.toLowerCase() !== 'credito') {
            totalPaid += amount;
          }
          
          if (method.toLowerCase() === 'credit' || method.toLowerCase() === 'credito') {
            hasCredit = true;
          }

          paymentsToCreate.push({
            amount,
            payment_method: method,
            reference: payment.reference || null,
            status: 'completed',
            notes: payment.notes || null
          });
        }
      } else {
        // Fallback: usar paidAmount del body
        totalPaid = Number(req.body.paidAmount) || 0;
        
        // Si hay paidAmount pero no payments, crear un pago implícito
        if (totalPaid > 0) {
          paymentsToCreate.push({
            amount: totalPaid,
            payment_method: paymentMethod || 'cash',
            reference: null,
            status: 'completed',
            notes: null
          });
        }
      }

      // Determinar estado de pago
      let paymentStatus = 'pending';
      if (totalPaid >= calculatedTotal) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      // Si hay crédito y no se pagó el total, es parcial
      if (hasCredit && totalPaid < calculatedTotal) {
        paymentStatus = 'partial';
      }

      // Calcular montos aplicados y pendientes
      const amountApplied = totalPaid;
      const amountPending = calculatedTotal - totalPaid;

      // Crear venta con Prisma
      const venta = await prisma.sales.create({
        data: {
          sale_number: `V-${Date.now()}`,
          user_id: userId,
          client_id: clientId,
          subtotal: calculatedSubtotal,
          total: calculatedTotal,
          paid_amount: totalPaid,
          amount_applied: amountApplied,
          amount_pending: amountPending,
          payment_method: paymentMethod || 'cash',
          payment_status: paymentStatus,
          sale_status: 'completed',
          notes: notes || null,
          sale_items: {
            create: itemsWithPrices
          },
          payments: paymentsToCreate.length > 0 ? {
            create: paymentsToCreate
          } : undefined
        },
        include: {
          sale_items: true,
          client: true,
          user: true,
          payments: true
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
          user: true,
          payments: true // Incluir pagos en la respuesta
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
          },
          payments: true // Incluir pagos en la lista
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
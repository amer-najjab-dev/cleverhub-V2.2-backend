import { Request, Response } from 'express';
import { prisma } from '../server';
import { CreateSaleDTO } from '../dtos/sale.dto';

export class VentaController {
  async crear(req: Request, res: Response) {
    console.log('Payload recibido:', JSON.stringify(req.body, null, 2));
    try {
      const { 
        userId, 
        clientId, 
        paymentMethod, 
        items, 
        payments: paymentItems, 
        notes,
        discountType: discountTypeBody,
        discountPercentage: discountPercentageBody,
        discountAmount: discountAmountBody
      } = req.body;
      
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

      // Procesar descuentos
      const discountAmount = Number(discountAmountBody || 0);
      const discountPercentage = discountPercentageBody ? Number(discountPercentageBody) : null;
      const discountType = discountTypeBody || null;

      // Calcular total con descuento
      let finalTotal = calculatedSubtotal;
      let appliedDiscountAmount = 0;

      if (discountType === 'percentage' && discountPercentage && discountPercentage > 0) {
        appliedDiscountAmount = calculatedSubtotal * (discountPercentage / 100);
        finalTotal = calculatedSubtotal - appliedDiscountAmount;
      } else if (discountType === 'fixed' && discountAmount && discountAmount > 0) {
        appliedDiscountAmount = discountAmount;
        finalTotal = calculatedSubtotal - discountAmount;
      }

      // Procesar pagos
      let totalPaid = 0;
      let hasCredit = false;
      let paymentsToCreate = [];
      let debtsToCreate = [];
      let saleNumber = `V-${Date.now()}`;

      if (paymentItems && Array.isArray(paymentItems) && paymentItems.length > 0) {
        // Usar el array de pagos del body
        for (const payment of paymentItems) {
          const amount = Number(payment.amount) || 0;
          const method = payment.method || 'cash';

          console.log('💰 Procesando pago:', { amount, method, clientId });
          
          const methodLower = method.toLowerCase();
          const isCredit = methodLower === 'credit' || methodLower === 'credito';
          
          if (isCredit) {
            // Es crédito - no va a payments, va a client_debts
             console.log('💳 Es crédito, creando deuda por:', amount);
            hasCredit = true;
            debtsToCreate.push({
              client_id: clientId,
              total_debt: amount,
              paid_amount: 0,
              status: 'pending',
              notes: `Deuda por venta ${saleNumber}`
            });
          } else {
            // Es pago real - va a payments y suma a totalPaid
            totalPaid += amount;
            paymentsToCreate.push({
              amount,
              payment_method: method,
              reference: payment.reference || null,
              status: 'completed',
              notes: payment.notes || null
            });
          }
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

      // ... después de procesar descuentos y pagos ...

      // Determinar estado de pago
      // Determinar estado de pago
      let paymentStatus = 'pending';
      if (totalPaid >= finalTotal) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0 && totalPaid < finalTotal) {
        paymentStatus = 'partial';
      } else {
        paymentStatus = 'pending';
      }

      // Calcular montos aplicados y pendientes (SOLO UNA VEZ)
      const amountApplied = totalPaid;
      const amountPending = Math.max(0, finalTotal - totalPaid);

      // Crear venta con Prisma (SOLO UNA VEZ)
      const venta = await prisma.sales.create({
        data: {
          sale_number: saleNumber,
          user_id: userId,
          client_id: clientId,
          subtotal: calculatedSubtotal,
          discount_amount: appliedDiscountAmount,
          discount_percentage: discountPercentage,
          discount_type: discountType,
          total: finalTotal,
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

      // Crear o actualizar deudas en client_debts
      if (debtsToCreate.length > 0) {
        for (const debt of debtsToCreate) {
          // Buscar si existe una deuda activa (pending_amount > 0) para este cliente
          const existingDebt = await prisma.client_debt.findFirst({
            where: {
              client_id: debt.client_id,
              pending_amount: { gt: 0 }
            },
            orderBy: { created_at: 'desc' }
          });

          if (existingDebt) {
            // Actualizar la deuda existente sumando la nueva deuda
            const newTotalDebt = Number(existingDebt.total_debt) + debt.total_debt;
            const newPendingAmount = Number(existingDebt.pending_amount) + debt.total_debt;
            
            await prisma.client_debt.update({
              where: { id: existingDebt.id },
              data: {
                total_debt: newTotalDebt,
                pending_amount: newPendingAmount,
                status: newPendingAmount > 0 ? 'pending' : 'paid',
                updated_at: new Date(),
                notes: existingDebt.notes 
                  ? `${existingDebt.notes}\n${debt.notes}` 
                  : debt.notes
              }
            });
          } else {
            // Crear nueva deuda si no existe ninguna activa
            await prisma.client_debt.create({
              data: {
                client_id: debt.client_id,
                total_debt: debt.total_debt,
                paid_amount: 0,
                status: 'pending',
                notes: debt.notes
              }
            });
          }
        }
      }

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
          payments: true
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
          payments: true
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
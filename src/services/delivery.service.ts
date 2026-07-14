import { prisma } from '../server';

export const deliveryService = {
  async registerDelivery(data: {
    note_number: string;
    supplier_id: string;
    bl_number?: string;
    reception_date: Date;
    items: {
      product_id: number;
      quantity: number;
      unit_cost_pph: number;
      suggested_ppv?: number;
      expiration_date: Date;
      batch_number?: string;
    }[];
    notes?: string;
    received_by: number;
    payment_terms?: string;
    due_date?: Date;
    pharmacy_id: number;
  }) {
    let totalAmount = 0;
    const itemsWithSubtotal = data.items.map(item => {
      const subtotal = item.quantity * item.unit_cost_pph;
      totalAmount += subtotal;
      return { ...item, subtotal };
    });

    const result = await prisma.$transaction(async (tx) => {
      const deliveryNote = await tx.delivery_notes.create({
        data: {
          note_number: data.note_number,
          supplier_id: data.supplier_id,
          bl_number: data.bl_number,
          reception_date: data.reception_date,
          total_amount: totalAmount,
          total_items: data.items.length,
          notes: data.notes,
          received_by: data.received_by,
          payment_status: 'pending'
        }
      });

      for (const item of itemsWithSubtotal) {
        await tx.delivery_note_items.create({
          data: {
            delivery_note_id: deliveryNote.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost_pph: item.unit_cost_pph,
            suggested_ppv: item.suggested_ppv,
            expiration_date: item.expiration_date,
            batch_number: item.batch_number,
            subtotal: item.subtotal
          }
        });

        await tx.inventory_lots.create({
          data: {
            product_id: item.product_id,
            pharmacy_id: data.pharmacy_id,
            batch_number: item.batch_number || `BATCH-${Date.now()}`,
            quantity: item.quantity,
            expiry_date: item.expiration_date
          }
        });

        await tx.products.update({
          where: { id: item.product_id },
          data: { pricePPH: item.unit_cost_pph }
        });
      }

      const dueDate = data.due_date || new Date();
      if (!data.due_date) {
        dueDate.setDate(dueDate.getDate() + 30);
      }

      const obligation = await tx.payment_obligations.create({
        data: {
          delivery_note_id: deliveryNote.id,
          supplier_id: data.supplier_id,
          total_amount: totalAmount,
          paid_amount: 0,
          pending_amount: totalAmount,
          due_date: dueDate,
          status: 'pending',
          payment_terms: data.payment_terms || '30 días'
        }
      });

      return { deliveryNote, obligation };
    });

    return result;
  },

  async registerObligationPayment(data: {
    obligation_id: number;
    amount: number;
    payment_method: string;
    reference?: string;
    notes?: string;
  }) {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.obligation_payments.create({
        data: {
          obligation_id: data.obligation_id,
          amount: data.amount,
          payment_method: data.payment_method,
          reference: data.reference,
          notes: data.notes
        }
      });

      const obligation = await tx.payment_obligations.findUnique({
        where: { id: data.obligation_id }
      });

      if (!obligation) throw new Error('Obligación no encontrada');

      const newPaidAmount = Number(obligation.paid_amount) + data.amount;
      const newPendingAmount = Number(obligation.total_amount) - newPaidAmount;
      const newStatus = newPendingAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'pending';

      const updatedObligation = await tx.payment_obligations.update({
        where: { id: data.obligation_id },
        data: {
          paid_amount: newPaidAmount,
          pending_amount: newPendingAmount,
          status: newStatus
        }
      });

      if (newStatus === 'paid') {
        await tx.delivery_notes.update({
          where: { id: obligation.delivery_note_id },
          data: {
            payment_status: 'paid',
            is_paid: true,
            paid_amount: newPaidAmount,
            paid_date: new Date()
          }
        });
      } else if (newPaidAmount > 0) {
        await tx.delivery_notes.update({
          where: { id: obligation.delivery_note_id },
          data: {
            payment_status: 'partial',
            paid_amount: newPaidAmount
          }
        });
      }

      return { payment, obligation: updatedObligation };
    });

    return result;
  },

  async getSupplierObligations(supplierId: string) {
    return await prisma.payment_obligations.findMany({
      where: { supplier_id: supplierId },
      include: {
        delivery_notes: {
          select: {
            note_number: true,
            reception_date: true,
            delivery_note_items: {
              select: {
                quantity: true,
                products: { select: { name: true } }
              }
            }
          }
        },
        obligation_payments: true
      },
      orderBy: { due_date: 'asc' }
    });
  }
};